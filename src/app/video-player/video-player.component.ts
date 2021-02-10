import {
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { FaceApiService } from '../face-api.service';
import { VideoPlayerService } from '../video-player.service';

@Component({
  selector: 'app-video-player',
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.scss'],
})
export class VideoPlayerComponent implements OnInit, OnDestroy {
  @Input() stream: any;
  @Input() width: number;
  @Input() height: number;

  @ViewChild('videoElement') videoElement: ElementRef;

  listEvents: Array<any> = [];
  modelsReady: boolean = false;
  overCanvas: any;

  constructor(
    private renderer2: Renderer2,
    private elementRef: ElementRef,
    private faceApiService: FaceApiService,
    private videoPlayerService: VideoPlayerService
  ) {}

  ngOnInit(): void {
    this.listenerEvents();
  }

  listenerEvents = () => {
    const observer1$ = this.faceApiService.cbModels.subscribe((res) => {
      console.log(`sbModels: ${res}`);
      this.modelsReady = true;
      this.checkFace();
    });

    const observer2$ = this.videoPlayerService.cbAi.subscribe(
      ({ resizedDetections, displaySize, expressions, eyes }) => {
        resizedDetections = resizedDetections[0] || null;
        if (resizedDetections) {
          this.drawFace(resizedDetections, displaySize, eyes);
        }
      }
    );
    this.listEvents = [observer1$, observer2$];
  };

  drawFace = (resizedDetections, displaySize, eyes) => {
    const { globalFace } = this.faceApiService;
    this.overCanvas
      .getContext('2d')
      .clearRect(0, 0, displaySize.width, displaySize.height);

    globalFace.draw.drawDetections(this.overCanvas, resizedDetections);
    globalFace.draw.drawFaceLandmarks(this.overCanvas, resizedDetections);
  };

  checkFace = () => {
    setInterval(async () => {
      await this.videoPlayerService.getLandMark(this.videoElement);
    }, 100);
  };

  loadedMetaData(): void {
    this.videoElement.nativeElement.play();
  }

  listenerPlay(): void {
    const { globalFace } = this.faceApiService;
    this.overCanvas = globalFace.createCanvasFromMedia(
      this.videoElement.nativeElement
    );
    this.renderer2.setProperty(this.overCanvas, 'id', 'new-canvas-over');
    this.renderer2.setStyle(this.overCanvas, 'width', `${this.width}px`);
    this.renderer2.setStyle(this.overCanvas, 'height', `${this.height}px`);
    this.renderer2.appendChild(this.elementRef.nativeElement, this.overCanvas);
  }

  ngOnDestroy(): void {
    this.listEvents.forEach((event) => event.unsubscribe());
  }
}
