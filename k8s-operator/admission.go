package main

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"strings"
)

type admissionReview struct {
	APIVersion string           `json:"apiVersion"`
	Kind       string           `json:"kind"`
	Request    *admissionRequest `json:"request"`
}

type admissionRequest struct {
	UID    string          `json:"uid"`
	Object json.RawMessage `json:"object"`
}

type admissionResponse struct {
	APIVersion string `json:"apiVersion"`
	Kind       string `json:"kind"`
	Response   struct {
		UID     string `json:"uid"`
		Allowed bool   `json:"allowed"`
		Status  *struct {
			Message string `json:"message"`
		} `json:"status,omitempty"`
	} `json:"response"`
}

type podObject struct {
	Metadata struct {
		Name        string            `json:"name"`
		Namespace   string            `json:"namespace"`
		Labels      map[string]string `json:"labels"`
		Annotations map[string]string `json:"annotations"`
	} `json:"metadata"`
	Spec struct {
		Containers []struct {
			Name  string `json:"name"`
			Image string `json:"image"`
		} `json:"containers"`
	} `json:"spec"`
}

var blockedImageHints = []string{
	"crypto-miner", "xmrig", "malicious", "shell-backdoor",
}

func evaluatePod(pod *podObject) (allowed bool, reason string) {
	if pod.Metadata.Labels["security.log-guardian.io/deny"] == "true" {
		return false, "label security.log-guardian.io/deny=true"
	}
	if pod.Metadata.Annotations["log-guardian.io/compromised"] == "true" {
		return false, "annotation log-guardian.io/compromised=true"
	}
	for _, c := range pod.Spec.Containers {
		img := strings.ToLower(c.Image)
		for _, hint := range blockedImageHints {
			if strings.Contains(img, hint) {
				return false, "blocked image pattern: " + hint
			}
		}
	}
	return true, ""
}

func handleAdmission(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "read error", http.StatusBadRequest)
		return
	}

	var review admissionReview
	if err := json.Unmarshal(body, &review); err != nil || review.Request == nil {
		http.Error(w, "invalid AdmissionReview", http.StatusBadRequest)
		return
	}

	var pod podObject
	if err := json.Unmarshal(review.Request.Object, &pod); err != nil {
		http.Error(w, "invalid pod object", http.StatusBadRequest)
		return
	}

	allowed, reason := evaluatePod(&pod)
	resp := admissionResponse{
		APIVersion: "admission.k8s.io/v1",
		Kind:       "AdmissionReview",
	}
	resp.Response.UID = review.Request.UID
	resp.Response.Allowed = allowed
	if !allowed {
		resp.Response.Status = &struct {
			Message string `json:"message"`
		}{Message: "Log Guardian admission denied: " + reason}
		log.Printf("[ADMISSION] DENY ns=%s pod=%s reason=%s",
			pod.Metadata.Namespace, pod.Metadata.Name, reason)
	} else {
		log.Printf("[ADMISSION] ALLOW ns=%s pod=%s", pod.Metadata.Namespace, pod.Metadata.Name)
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(resp)
}
