package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	v1 "k8s.io/api/core/v1"
	networkingv1 "k8s.io/api/networking/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
)

// GuardianKillRequest represents the payload sent by Log Guardian's k8s_webhook.c
type GuardianKillRequest struct {
	PID          int    `json:"pid"`
	ContainerID  string `json:"container_id"`
	WorkloadName string `json:"workload_name"`
	ParentComm   string `json:"parent_comm"`
	ExecFilename string `json:"exec_filename"`
	Argv1        string `json:"argv1"`
	TimestampNs  uint64 `json:"timestamp_ns"`
	IsContainer  string `json:"is_container"`
}

func main() {
	log.Println("Starting Log Guardian K8s Operator...")

	standalone := os.Getenv("GUARDIAN_STANDALONE") == "1"
	var clientset *kubernetes.Clientset

	if standalone {
		log.Println("Standalone mode — /admit only (no cluster API)")
	} else {
		config, err := rest.InClusterConfig()
		if err != nil {
			log.Fatalf("Failed to load in-cluster config: %v. Set GUARDIAN_STANDALONE=1 for local /admit tests.", err)
		}

		var err2 error
		clientset, err2 = kubernetes.NewForConfig(config)
		if err2 != nil {
			log.Fatalf("Failed to create k8s clientset: %v", err2)
		}
	}

	http.HandleFunc("/admit", handleAdmission)

	if clientset != nil {
		registerKillPod(clientset)
	} else {
		http.HandleFunc("/kill-pod", func(w http.ResponseWriter, r *http.Request) {
			http.Error(w, "kill-pod requires in-cluster mode", http.StatusServiceUnavailable)
		})
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8082"
	}

	log.Printf("Listening on :%s (/admit, /kill-pod)", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatalf("HTTP server failed: %v", err)
	}
}

func registerKillPod(clientset *kubernetes.Clientset) {
	http.HandleFunc("/kill-pod", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		expected := os.Getenv("K8S_OPERATOR_TOKEN")
		if expected == "" {
			http.Error(w, "K8S_OPERATOR_TOKEN not configured", http.StatusServiceUnavailable)
			return
		}
		auth := r.Header.Get("Authorization")
		if auth != "Bearer "+expected {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		var req GuardianKillRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			log.Printf("Invalid request payload: %v", err)
			http.Error(w, "Bad request", http.StatusBadRequest)
			return
		}

		log.Printf("Received kill request from Guardian: PID=%d, Container=%s, Workload=%s", req.PID, req.ContainerID, req.WorkloadName)

		if req.IsContainer != "true" || req.ContainerID == "unknown" {
			log.Printf("Target is not a container or ID unknown. Ignoring.")
			w.WriteHeader(http.StatusOK)
			return
		}

		containerID := req.ContainerID
		if strings.HasPrefix(containerID, "docker://") {
			containerID = strings.TrimPrefix(containerID, "docker://")
		} else if strings.HasPrefix(containerID, "containerd://") {
			containerID = strings.TrimPrefix(containerID, "containerd://")
		}

		err := findAndKillPod(clientset, containerID)
		if err != nil {
			log.Printf("Failed to kill pod: %v", err)
			http.Error(w, "Failed to process kill request", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
		fmt.Fprintf(w, "Pod termination initiated\n")
	})
}

func findAndKillPod(clientset *kubernetes.Clientset, targetContainerID string) error {
	pods, err := clientset.CoreV1().Pods("").List(context.Background(), metav1.ListOptions{})
	if err != nil {
		return fmt.Errorf("failed to list pods: %w", err)
	}

	for _, pod := range pods.Items {
		for _, containerStatus := range pod.Status.ContainerStatuses {
			// containerStatus.ContainerID format is usually "containerd://<id>" or "docker://<id>"
			id := containerStatus.ContainerID
			if strings.HasPrefix(id, "docker://") {
				id = strings.TrimPrefix(id, "docker://")
			} else if strings.HasPrefix(id, "containerd://") {
				id = strings.TrimPrefix(id, "containerd://")
			}

			// Partial match or exact match depending on how cgroup parse returned the ID
			if strings.HasPrefix(id, targetContainerID) || strings.HasPrefix(targetContainerID, id) {
				log.Printf("Found malicious pod: %s in namespace %s. Initiating Zero-Trust Forensic Isolation.", pod.Name, pod.Namespace)
				
				err := isolatePod(clientset, &pod)
				if err != nil {
					return fmt.Errorf("failed to isolate pod %s/%s: %w", pod.Namespace, pod.Name, err)
				}
				log.Printf("Pod %s/%s successfully isolated via NetworkPolicy.", pod.Namespace, pod.Name)
				return nil
			}
		}
	}

	return fmt.Errorf("no pod found matching container ID: %s", targetContainerID)
}

func isolatePod(clientset *kubernetes.Clientset, pod *v1.Pod) error {
	policyName := fmt.Sprintf("isolate-malicious-%s", pod.Name)

	// Create a Deny-All NetworkPolicy for this specific pod
	policy := &networkingv1.NetworkPolicy{
		ObjectMeta: metav1.ObjectMeta{
			Name:      policyName,
			Namespace: pod.Namespace,
			Labels: map[string]string{
				"log-guardian-managed": "true",
			},
		},
		Spec: networkingv1.NetworkPolicySpec{
			PodSelector: metav1.LabelSelector{
				MatchLabels: pod.Labels,
			},
			PolicyTypes: []networkingv1.PolicyType{
				networkingv1.PolicyTypeIngress,
				networkingv1.PolicyTypeEgress,
			},
			// Empty Ingress and Egress means DENY ALL
			Ingress: []networkingv1.NetworkPolicyIngressRule{},
			Egress:  []networkingv1.NetworkPolicyEgressRule{},
		},
	}

	_, err := clientset.NetworkingV1().NetworkPolicies(pod.Namespace).Create(context.Background(), policy, metav1.CreateOptions{})
	
	// If it already exists, that's fine
	if err != nil && !strings.Contains(err.Error(), "already exists") {
		return err
	}

	// Optionally label the pod as compromised for forensic tools to pick up
	pod.Labels["security.log-guardian.io/compromised"] = "true"
	_, err = clientset.CoreV1().Pods(pod.Namespace).Update(context.Background(), pod, metav1.UpdateOptions{})
	if err != nil {
		log.Printf("Warning: Failed to label pod as compromised: %v", err)
	}

	return nil
}
