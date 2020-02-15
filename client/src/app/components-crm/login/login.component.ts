import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { ToastService } from '../../services/toast.service';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  constructor(private auth:AuthService, 
              private router:Router,
              private toastr:ToastService
              ) { }

  public user:any ={
    email:"",
    password:""
  };

  private current:any;

  ngOnInit() {
  }

  onLogin(){
    return this.auth.loginuser(this.user.email,this.user.password)
      .subscribe(succes=>{
        this.auth.setUser(succes.user);
        let token=succes.id;
        this.auth.setToken(token);
        this.current=this.auth.getCurrentUser();
        if(this.current.realm=="admin" && this.current.active){
          this.toastr.showSuccess('Inicio de sesión exitoso');
          this.router.navigate(["/usuarios"])
        }
        else if (this.current.realm=="user" && this.current.active){
          this.toastr.showSuccess('Inicio de sesión exitoso');
          this.router.navigate(["/clientes"])
        }
        else{
          this.toastr.showError('Usuario invalido')
        }
      }, err=>{
        this.toastr.showError('Datos incorrectos');
      })
  }

}