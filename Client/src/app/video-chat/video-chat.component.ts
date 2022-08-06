import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { DataService } from '../services/data.service';

@Component({
  selector: 'app-video-chat',
  templateUrl: './video-chat.component.html',
  styleUrls: ['./video-chat.component.css']
})
export class VideoChatComponent implements OnInit, AfterViewInit {
  mediaConstraints = {
    audio : true,
    video: {width: 1280, height: 720}
  };

  offerOption = {
    offerToReceiveAudio : true,
    offerToReceiveVideo : true
  };

  private peerConnection!: RTCPeerConnection;

  private localStream!: MediaStream;
  @ViewChild('localVideo') localVideo! : ElementRef;
  @ViewChild('remoteVideo') remoteVideo! : ElementRef;
  
  constructor(private dataService: DataService) { }
  
  ngOnInit(): void {
    this.dataService.createHubConnection();
  }

  ngAfterViewInit(): void {
    this.addIncomingMessageHandler();
    this.requestMediaDevices();
  }
  
  private async requestMediaDevices() {
    this.localStream = await navigator.mediaDevices.getUserMedia(this.mediaConstraints);
    this.pauseLocalStream();
  }

  pauseLocalStream(){
    this.localStream.getTracks().forEach(element => {
      element.enabled = false;
    });

    this.localVideo.nativeElement.srcObject = undefined;
  }

  startLocalStream(){
    this.localStream.getTracks().forEach(element => {
      element.enabled = true;
    });

    this.localVideo.nativeElement.srcObject = this.localStream;
  }

  async call(){
    this.createPeerConnection();
    this.localStream.getTracks().forEach(track =>{
      this.peerConnection.addTrack(track, this.localStream);
    })

    try{
      const offer: RTCSessionDescriptionInit = await this.peerConnection.createOffer(this.offerOption);
      this.peerConnection.setLocalDescription(offer);

      this.dataService.sendMessage({type: 'offer', data: offer});
    }
    catch(error){
      console.log(error);
    }
  }
  createPeerConnection() {
    this.peerConnection = new RTCPeerConnection({
      iceServers:[{
        urls: ['stun:stun1.l.google.com:19302']
      }
      ]
    })

    this.peerConnection.onicecandidate = this.handleICECandidateEvent;
    this.peerConnection.onicegatheringstatechange = this.handleIceConnectionStateChangeEvent;
    this.peerConnection.onsignalingstatechange = this.handleSignalingStateEvent;
    this.peerConnection.ontrack = this.handleTrackEvent;
  }

  private handleICECandidateEvent =  (event : RTCPeerConnectionIceEvent): void => {
    console.log(event);

    if(event.candidate){
      this.dataService.sendMessage({
        type: 'ice-candidate',
        data: event.candidate
      });
    }
  }

  private handleIceConnectionStateChangeEvent (event : Event): void {
    console.log(event);

    // switch(this.peerConnection.iceConnectionState){
    //   case 'closed':
    //   case 'failed':
    //   case 'disconnected';

    // }
  }

  private handleSignalingStateEvent (event : Event): void {
    console.log(event);
  }

  private handleTrackEvent = (event : RTCTrackEvent): void => {
    console.log(event);
    let a = this.localVideo;
    this.remoteVideo.nativeElement.srcObject = event.streams[0];
  }

  addIncomingMessageHandler() {

    this.dataService.messages$.subscribe(msg => {
        if(msg.type == 'offer'){
          this.handleOfferMessage(msg.data);
        }
        else if(msg.type == 'answer'){
          this.handleAnswerMessage(msg.data);
        }
        else if(msg.type == 'ice-candidate'){
          this.handleIceCandidateMessage(msg.data);
        }
        
    })
  }
  handleIceCandidateMessage(data: any) {
    this.peerConnection.addIceCandidate(data);
  }
  handleAnswerMessage(data: any) {
    this.peerConnection.setRemoteDescription(data);
  }

  handleOfferMessage(data: RTCSessionDescriptionInit) {
    if(!this.peerConnection)
      this.createPeerConnection();

    if(!this.localStream)
      this.startLocalStream();

    this.peerConnection.setRemoteDescription(new RTCSessionDescription(data))
    .then(()=>{
      this.localVideo.nativeElement.srcObject = this.localStream;

      this.localStream.getTracks().forEach(track => this.peerConnection.addTrack(track, this.localStream));
    })
    .then(()=> {
      return this.peerConnection.createAnswer();
    })
    .then(answer => {
      return this.peerConnection.setLocalDescription(answer);
    })
    .then(() => {
      this.dataService.sendMessage({type: 'answer', data: this.peerConnection.localDescription});
    })
  }

  

}
