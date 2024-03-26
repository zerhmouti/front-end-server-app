import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, Observable, catchError, map, of, startWith } from 'rxjs';
import { AppState } from './interface/app.state';
import { ServerService } from './service/server.service';
import { CustomResponse } from './interface/custom-response';
import { DataState } from './enum/data-state.enum';
import { Server } from './interface/server';
import { Status } from './enum/status.enum';
import { NgForm } from '@angular/forms';
import { NotificationService } from './service/notification.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  appState$: Observable<AppState<CustomResponse>>;
  readonly DataState = DataState;
  readonly Status = Status;
  private filterSubject = new BehaviorSubject<string>('');
  private dataSubject = new BehaviorSubject<CustomResponse>(null);
  filterStatus$ = this.filterSubject.asObservable();
  isLoading = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoading.asObservable();

  // private readonly notifier: NotifierService;

  constructor(private serverService: ServerService, private notifier:NotificationService) { }

  ngOnInit(): void {
    this.appState$ = this.serverService.server$
      .pipe(
        map(response => {
          this.dataSubject.next(response);
          this.notifier.onDefault(response.message);
          return { dataState: DataState.LOADED_STATE, appData: {...response, data: {servers: response.data.servers.reverse()}} }
        }),
        startWith({ dataState: DataState.LOADING_STATE }),
        catchError((error: string) => {
          this.notifier.onError(error)
          return of({ dataState: DataState.ERROR_STATE, error: error })
        })
      );
  }

  ping(ipAddress: string): void {
    this.filterSubject.next(ipAddress);
    this.appState$ = this.serverService.ping$(ipAddress)
      .pipe(
        map(response => {
          this.dataSubject.value.data.servers[
            this.dataSubject.value.data.servers.findIndex(server=>server.id===response.data.server.id)
          ] = response.data.server ;
          this.filterSubject.next('');
          this.notifier.onDefault(response.message);
          return { dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }
        }),
        startWith({ dataState: DataState.LOADED_STATE, appData:this.dataSubject.value}),
        catchError((error: string) => {
          this.filterSubject.next('');
          return of({ dataState: DataState.ERROR_STATE, error: error })
        })
      );
  }

  filterServers(status: Status): void {
    this.appState$ = this.serverService.filter$(status, this.dataSubject.value)
      .pipe(
        map(response => {
          this.notifier.onDefault(response.message);
          return { dataState: DataState.LOADED_STATE, appData: response };
        }),
        startWith({ dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }),
        catchError((error: string) => {
          return of({ dataState: DataState.ERROR_STATE, error });
        })
      );
  }

  saveServer(serverForm: NgForm): void {
    this.isLoading.next(true);
    this.appState$ = this.serverService.save$(<Server>serverForm.value)
      .pipe(
        map(response => {
          this.dataSubject.next({
            ...response, data:{
              servers:[response.data.server, ...this.dataSubject.value.data.servers]
            }
          });
          document.getElementById('closeModal').click();
          this.isLoading.next(false);
          serverForm.resetForm({status: this.Status.SERVER_DOWN});
          this.notifier.onDefault(response.message);
          return { dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }
        }),
        startWith({ dataState: DataState.LOADED_STATE, appData:this.dataSubject.value}),
        catchError((error: string) => {
          this.isLoading.next(false);
          return of({ dataState: DataState.ERROR_STATE, error: error })
        })
      );
  }

  deleteServer(serverId:number){
    this.appState$ = this.serverService.delte$(serverId)
    .pipe(
      map(response=>{
        this.dataSubject.next({...response, data:{servers: this.dataSubject.value.data.servers.filter(s=> s.id!==serverId)}});
        this.notifier.onDefault(response.message);
        return {dataState:DataState.LOADED_STATE, appData: this.dataSubject.value}
      }),
      startWith({dataState:DataState.LOADED_STATE, appData: this.dataSubject.value}),
      catchError((error: string) => {
        return of({ dataState: DataState.ERROR_STATE, error: error })
      })
    );
  }

  printReport(): void {
    this.notifier.onDefault('Report downloaded');
    // window.print();
    let dataType = 'application/vnd.ms-excel.sheet.macroEnabled.12';
    let tableSelect = document.getElementById('servers');
    let tableHtml = tableSelect.outerHTML.replace(/ /g, '%20');
    let downloadLink = document.createElement('a');
    console.log(downloadLink);
    document.body.appendChild(downloadLink);
    downloadLink.href = 'data:' + dataType + ', ' + tableHtml;
    downloadLink.download = 'server-report.xls';
    downloadLink.click();
    document.body.removeChild(downloadLink);
  }

}
