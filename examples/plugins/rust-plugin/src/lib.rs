//! Log Guardian Wasm plugin — export analyze(ptr, len) -> i32
//! 0=pass, 1=block, 2=tarpit
//! wasm32-unknown-unknown: WASI import gerektirmez (Wasmtime sandbox).

#![no_std]

#[panic_handler]
fn panic(_: &core::panic::PanicInfo) -> ! {
    loop {}
}

#[no_mangle]
pub extern "C" fn analyze(ptr: i32, len: i32) -> i32 {
    if ptr == 0 || len <= 0 || len > 65536 {
        return 0;
    }
    let slice = unsafe { core::slice::from_raw_parts(ptr as *const u8, len as usize) };
    if contains_ci_norm(slice, b"union select")
        || contains_ci_norm(slice, b"or 1=1")
        || contains_ci_norm(slice, b"1=1")
    {
        return 1;
    }
    if contains_ci_norm(slice, b"sqlmap") || contains_ci_norm(slice, b"nikto") {
        return 1;
    }
    0
}

fn ascii_lower(c: u8) -> u8 {
    if c >= b'A' && c <= b'Z' {
        c + 32
    } else {
        c
    }
}

fn contains_ci_norm(hay: &[u8], needle: &[u8]) -> bool {
    if needle.is_empty() || hay.len() < needle.len() {
        return false;
    }
    let mut i = 0usize;
    while i + needle.len() <= hay.len() {
        let mut j = 0usize;
        while j < needle.len() {
            let hc = ascii_lower(hay[i + j]);
            let nc = if needle[j] == b' ' {
                b' '
            } else {
                ascii_lower(needle[j])
            };
            let hc = if hc == b'+' { b' ' } else { hc };
            if hc != nc {
                break;
            }
            j += 1;
        }
        if j == needle.len() {
            return true;
        }
        i += 1;
    }
    false
}
