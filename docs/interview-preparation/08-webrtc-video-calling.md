# 08. WebRTC & Video/Audio Calling Deep Dive — Engaze

## WebRTC Fundamentals & Architectural Role in Engaze

**WebRTC (Web Real-Time Communication)** is an open standard that enables peer-to-peer (P2P) audio, video, and data communication directly between web browsers and mobile devices without requiring intermediate media streaming servers.

### Why Engaze Uses WebRTC
1. **Zero Media Bandwidth Costs:** In a dating application with thousands of active calls, routing live video streams through backend servers would incur massive bandwidth bills and require complex SFU/MCU (Selective Forwarding Unit) media clusters. With WebRTC, media flows directly between user devices over encrypted UDP tunnels.
2. **Sub-Second Latency:** Direct P2P transmission provides glass-to-glass latency under 150 ms, essential for natural romantic conversations.
3. **End-to-End Encryption:** All audio and video payloads are mandated by the WebRTC standard to be encrypted via **DTLS (Datagram Transport Layer Security)** and **SRTP (Secure Real-time Transport Protocol)**.

---

## 1. WebRTC vs. Socket.IO: Clear Separation of Concerns

One of the most critical concepts to articulate in technical interviews is the strict division of labor between WebRTC and Socket.IO:

| Operational Responsibility | Technology Used | Why? |
| :--- | :--- | :--- |
| **Media Stream Capture** (Camera/Mic) | **WebRTC (`getUserMedia`)** | Native browser hardware access to encode video/audio frames into VP8/H.264 and Opus codecs. |
| **Call Authentication & Mutual Consent** | **Socket.IO + Express/MongoDB** | Verifies mutual match authorization and ensures neither party has blocked the other. |
| **Call Ringing & High-Priority Push** | **Socket.IO + FCM** | Delivers call notifications and triggers native Android ringtones. |
| **Signaling Gateway** (SDP Offer/Answer & ICE) | **Socket.IO (`call:signal`)** | WebRTC cannot discover peers on its own; Socket.IO acts as the secure postal service relaying connection metadata. |
| **Media Transport** (Video & Audio Packets) | **WebRTC (`RTCPeerConnection`)** | Transports encrypted RTP packets directly peer-to-peer over UDP. **Zero bytes of video pass through Node.js.** |

---

## 2. The Complete Video Calling Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Alice as Alice (Caller)
    participant AliceApp as Alice Client (DirectCallContext.jsx)
    participant Server as Socket.IO Signaling Server (socketManager.js)
    participant Mongo as MongoDB Atlas (Call Record)
    participant BobApp as Bob Client (DirectCallContext.jsx)
    actor Bob as Bob (Callee)

    Alice->>AliceApp: Clicks "Video Call"
    AliceApp->>AliceApp: navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    AliceApp->>Server: socket.emit('call:initiate', { targetUserId: Bob_ID, callType: 'video' })

    Server->>Mongo: Verify mutual match between Alice & Bob
    Server->>Server: Verify neither Alice nor Bob is currently in a call
    Server->>Mongo: Create Call record { callId, caller: Alice, receiver: Bob, status: 'ringing' }

    par Alert Caller
        Server-->>AliceApp: socket.emit('call:ringing', { callId })
        AliceApp->>AliceApp: RingtoneEngine.startRing('outgoing') (440Hz tone)
    and Alert Callee
        Server-->>BobApp: io.to('user:Bob_ID').emit('call:incoming', { callId, caller: AliceInfo })
        BobApp->>BobApp: RingtoneEngine.startRing('incoming') (Two-tone chime)
    end

    Note over Server: Server sets 45-second no-answer timeout timer

    Bob->>BobApp: Clicks "Accept Call"
    BobApp->>BobApp: RingtoneEngine.stop()
    BobApp->>BobApp: navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    BobApp->>Server: socket.emit('call:accept', { callId })

    Server->>Mongo: Update Call status: 'connected', answeredAt: Date.now()
    Server-->>AliceApp: socket.emit('call:accepted', { callId })
    AliceApp->>AliceApp: RingtoneEngine.stop()

    Note over AliceApp,BobApp: Step 1: SDP Offer Creation & Exchange
    AliceApp->>AliceApp: pc = new RTCPeerConnection(iceServers)
    AliceApp->>AliceApp: localStream.getTracks().forEach(track => pc.addTrack(track, localStream))
    AliceApp->>AliceApp: const offer = await pc.createOffer()
    AliceApp->>AliceApp: await pc.setLocalDescription(offer)
    AliceApp->>Server: socket.emit('call:signal', { targetUserId: Bob_ID, signal: { type: 'offer', sdp: offer.sdp } })
    Server-->>BobApp: socket.emit('call:signal', { senderUserId: Alice_ID, signal: offer })

    Note over AliceApp,BobApp: Step 2: SDP Answer Creation & Exchange
    BobApp->>BobApp: pc = new RTCPeerConnection(iceServers)
    BobApp->>BobApp: localStream.getTracks().forEach(track => pc.addTrack(track, localStream))
    BobApp->>BobApp: await pc.setRemoteDescription(new RTCSessionDescription(offer))
    BobApp->>BobApp: const answer = await pc.createAnswer()
    BobApp->>BobApp: await pc.setLocalDescription(answer)
    BobApp->>Server: socket.emit('call:signal', { targetUserId: Alice_ID, signal: { type: 'answer', sdp: answer.sdp } })
    Server-->>AliceApp: socket.emit('call:signal', { senderUserId: Bob_ID, signal: answer })
    AliceApp->>AliceApp: await pc.setRemoteDescription(new RTCSessionDescription(answer))

    Note over AliceApp,BobApp: Step 3: Trickle ICE Candidate Gathering & NAT Traversal
    AliceApp->>AliceApp: pc.onicecandidate = (event) => emit('call:signal', { signal: event.candidate })
    BobApp->>BobApp: pc.onicecandidate = (event) => emit('call:signal', { signal: event.candidate })
    AliceApp->>Server: Relays Alice ICE candidates
    Server-->>BobApp: BobApp.pc.addIceCandidate(candidate)
    BobApp->>Server: Relays Bob ICE candidates
    Server-->>AliceApp: AliceApp.pc.addIceCandidate(candidate)

    Note over AliceApp,BobApp: Step 4: Direct Peer-to-Peer Media Tunnel Established
    AliceApp<<-->>BobApp: Bi-directional SRTP encrypted audio/video stream

    Alice->>AliceApp: Clicks "End Call"
    AliceApp->>Server: socket.emit('call:end', { callId, reason: 'completed' })
    Server->>Mongo: Finalize Call status: 'completed', endedAt, durationSeconds
    Server-->>BobApp: socket.emit('call:ended', { callId, reason: 'completed' })
    AliceApp->>AliceApp: stopLocalMedia() & closePeerConnection()
    BobApp->>BobApp: stopLocalMedia() & closePeerConnection()
```

---

## 3. Media Acquisition & Track Lifecycle Management

### Hardware Acquisition
```javascript
const stream = await navigator.mediaDevices.getUserMedia({
    video: {
        width: { ideal: 1280, max: 1920 },
        height: { ideal: 720, max: 1080 },
        facingMode: "user"
    },
    audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
    }
});
```

### In-Call Controls: Mute & Video Toggle
To mute audio or disable video without tearing down the underlying `RTCPeerConnection`:
```javascript
// Toggle Mute Audio
localStream.getAudioTracks().forEach(track => {
    track.enabled = !track.enabled;
});

// Toggle Video (Camera Off)
localStream.getVideoTracks().forEach(track => {
    track.enabled = !track.enabled;
});
```
* **Why `track.enabled = false` instead of `track.stop()`?**
  Setting `track.enabled = false` instructs the media encoder to transmit silent audio packets or black video frames. The WebRTC renegotiation pipeline remains intact, allowing instant unmuting without renegotiating SDP offers.

### Complete Teardown (`stopLocalMedia`)
When the call terminates, hardware access must be immediately released so the Android status bar and browser tab extinguish camera recording indicator dots:
```javascript
const stopLocalMedia = () => {
    if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
            try {
                track.stop(); // Releases OS camera/mic lock immediately
            } catch (e) {
                console.warn("Error stopping track:", e);
            }
        });
        localStreamRef.current = null;
        setLocalStream(null);
    }
};
```

---

## 4. NAT Traversal: STUN and TURN Explained

Because user devices reside behind home Wi-Fi routers and mobile carrier NATs (Network Address Translation), devices cannot communicate using private IP addresses (e.g., `192.168.1.5`).

### 1. STUN (Session Traversal Utilities for NAT)
* **How it works:** Alice sends a lightweight UDP binding request to a public Google STUN server (`stun:stun.l.google.com:19302`). The STUN server inspects the incoming UDP packet and responds with Alice's public IP address and port mapping as seen from the open internet.
* **Coverage:** Successfully connects ~85% of standard consumer networks.

### 2. TURN (Traversal Using Relays around NAT)
* **When needed:** When symmetric NATs or restrictive cellular firewalls block direct UDP hole punching.
* **How it works:** Media packets are relayed through a public TURN server acting as a secure intermediary.
* **Engaze Configuration (`backend/src/config/webrtc.js`):**
  Provides dynamic STUN/TURN server configurations via `/api/v1/webrtc/ice-servers` with in-memory 5-minute caching on the client.

---

## 5. Android WebView Permission Bridge (`MainActivity.java`)

When running inside Capacitor on Android, the standard browser permission prompt cannot surface automatically. In `MainActivity.java`, Engaze implements a custom `BridgeWebChromeClient` override:
```java
@Override
public void onPermissionRequest(final PermissionRequest request) {
    MainActivity.this.runOnUiThread(() -> {
        // Automatically grants CAMERA and RECORD_AUDIO inside the trusted WebView
        request.grant(request.getResources());
    });
}
```
This is paired with Android runtime permissions declared in `AndroidManifest.xml`:
* `android.permission.CAMERA`
* `android.permission.RECORD_AUDIO`
* `android.permission.MODIFY_AUDIO_SETTINGS`
