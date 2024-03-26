import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, tap } from 'rxjs/operators';
import { CustomResponse } from '../interface/custom-response';
import { Observable, Subscriber, throwError } from 'rxjs';
import { Server } from '../interface/server';
import { Status } from '../enum/status.enum';

@Injectable({
  providedIn: 'root'
})
export class ServerService {
 
  private readonly apiUrl= 'http://localhost:8080';

  constructor(private http: HttpClient) { }

  server$ = <Observable<CustomResponse>>
  this.http.get<CustomResponse>(`${this.apiUrl}/server/list`)
  .pipe(
    tap(console.log),
    catchError(this.handleError)
  );
    

  filter$ = (status: Status, response: CustomResponse) => <Observable<CustomResponse>>
  new Observable<CustomResponse>(
    Suscriber => {
      console.log(response);
      Suscriber.next(
        status === Status.ALL? { ...response, message:`Servers filtered by ${status} status`}:
        {
          ...response,
          message: response.data.servers
          .filter(server=>server.status===status).length>0? `Servers filtered by
          ${status=== Status.SERVER_UP ? 'SERVER UP'
          : 'SERVER DOWN' } status` : `No servers of ${status} found`,
          data: {servers: response.data.servers
          .filter(server=> server.status===status)}
        }
      );
      Suscriber.complete();
    }
  )
  .pipe(
    tap(console.log),
    catchError(this.handleError)
  );

  
  ping$ =(ipAddress:string): Observable<CustomResponse>=>
  this.http.get<CustomResponse>(`${this.apiUrl}/server/ping/${ipAddress}`)
  .pipe(
    tap(console.log),
    catchError(this.handleError)
  );

  delte$ =(serverId:number): Observable<CustomResponse>=>  
  this.http.delete<CustomResponse>(`${this.apiUrl}/server/delete/${serverId}`)
  .pipe(
    tap(console.log),
    catchError(this.handleError)
  );

  save$ =(data:Server): Observable<CustomResponse> =>
    this.http.post(`${this.apiUrl}/server/save`,data)
    .pipe(
      tap(console.log),
      catchError(this.handleError)
    )
  
  private handleError(error: HttpErrorResponse): Observable<never> {
    console.log(error);
    return throwError(`An error has occured - Error code : ${error.status}`);
  }

}
  