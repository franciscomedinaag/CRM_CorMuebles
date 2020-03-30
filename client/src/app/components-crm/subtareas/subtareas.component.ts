import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { DataApiService } from '../../services/data-api.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-subtareas',
  templateUrl: './subtareas.component.html',
  styleUrls: ['./subtareas.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class SubtareasComponent implements OnInit {

  private tratos:any=[]
  private categorias:any=[]
  private subtarea:any={
    fechaInicio:"",
    fechaFin:"",
    titulo:"",
    descripcion:"",
    estado:0,
    tratoId:"",
    categoriaId:""
  }
  private subtareas:any=[];
  private id:any;
  private full:any;
  private hoyGuion:any;
  private hoyLocale:any;
  private showModal:boolean=true;
  private showDesc:boolean=true;
  private estado=0;
  private userTel:any;
  private allSubtareas:any;
  private efe:any;


  constructor(private api:DataApiService, private auth:AuthService, private toast:ToastService, private router:Router) { }

  ngOnInit() {
    this.id=this.auth.getCurrentUser().id;
    this.hoyGuion=SubtareasComponent.setHoy()
    this.hoyLocale=this.setHoyLocale()
    this.getTratos()
    this.getCategorias()
    this.getSub()
    this.full=this.subtarea
  }

  private static setHoy():string{ //Obtener hoy en formato con guion (del ddatepicker)
    let hoy;
    hoy=new Date().toLocaleDateString();
    hoy=hoy.split('/');
      if(hoy[0].length<2){
        hoy[0]='0'+hoy[0]
      }
      if(hoy[1].length<2){
        hoy[1]='0'+hoy[1]
      }
    let hoyString=hoy[0]+'-'+hoy[1]+'-'+hoy[2]
    hoy=hoyString
    return hoyString;
  }

  private  setHoyLocale():string{//fecha local en formato ISO
    let inicio=this.hoyGuion.split("-")
    let i= new Date(inicio[2], inicio[1]-1, inicio[0]).toISOString();
    return i
  }

  getTratos(){
    this.api.get('/Tratos',true,{where:{estado:0,vendedorId:this.id}})
    .subscribe((tratos)=>{
      this.tratos=tratos
    })  
  }

  getCategorias(){
    this.api.get('/CategoriaSubs',true)
    .subscribe((categorias)=>{
      this.categorias=categorias
    })  
  }

  getSub(){
    let fail=0;
    let done=0;
    let pend=0;
    let data={vendedorId:this.id}
    this.subtareas=[]
    this.api.post('/Subtareas/getSubtareas', {data:data})
    .subscribe((subtareas)=>{
      this.allSubtareas=subtareas
      this.allSubtareas.forEach(s => {
        s.catName=this.categorias.find(x=>x.id==s.categoriaId).nombre
        if(s.fechaFin<this.hoyLocale && s.estado==0){
          this.setVencida(s)
        }
        
        if(s.estado==1 && done<=20){
          //añadir solo 20 subtareas
          this.subtareas.push(s)
          done++;
        }
        else if(s.estado==2 && fail<=20){
          //añadir solo 20 subtareas
          this.subtareas.push(s)
          fail++;
        }
        else if(s.estado==0){
          this.subtareas.push(s)
          pend++;
        }
      });
    })
  }
  
  setVencida(s){
    s.estado=2;
    this.api.patch('/Subtareas',s).subscribe((okay)=>{})
  }

  createSub(){
    let inicio=this.hoyGuion.split("-")
    let i= new Date(inicio[2], inicio[1]-1, inicio[0]).toISOString();
    let mesSub=this.subtarea.fechaFin.split("-")[1]
    this.subtarea.fechaInicio=i;
    
    if(this.subtarea.titulo=="" || this.subtarea.fechaFin=="" || this.subtarea.descripcion=="" ||
    this.subtarea.tratoId=="" ||this.subtarea.categoriaId==""){
      this.toast.showError("Debes llenar todos los campos")
      return
    }
    else if(this.subtarea.fechaFin<this.hoyGuion && mesSub<=inicio[1]){
      this.toast.showError("La fecha límite ya pasó")
      return
    }
    else{
      let fin=this.subtarea.fechaFin.split("-");
      let f= new Date(fin[2], fin[1] - 1, fin[0]).toISOString();
      this.efe=f;
      this.subtarea.fechaFin=f;
      if(this.subtarea.categoriaId==5){
        this.api.get(`/Subtareas`,true,{where:{tratoId:this.subtarea.tratoId,categoriaId:5}})
        .subscribe((subs:any)=>{
          subs.forEach(s => {
            this.api.get(`/Cotizaciones`,true,{where:{subtareaId:s.id}})
            .subscribe((coti:any)=>{
              console.log("coti", coti)
              let cotiz=coti[0]
              cotiz.definitivo=false
              this.api.patch(`/Cotizaciones`,cotiz)
              .subscribe((okay)=>{})
            })
          });
          this.subtarea.fechaFin=this.efe
          this.api.post('/Subtareas',this.subtarea)
          .subscribe((okay:any)=>{
          if(okay.categoriaId==5){
            let cotizacion:any={
              manoObra:0,
              administrativos:0,
              utilidad:0,
              impuestos:0,
              subtareaId:okay.id,
              definitivo:true,
              total:0
            }  
            this.api.post(`/Cotizaciones`,cotizacion)
            .subscribe((coti)=>{
            })  
          }
          this.subtarea={ fechaInicio:"",
          fechaFin:"",
          titulo:"",
          descripcion:"",
          estado:0,
          tratoId:"",
          categoriaId:""}
          this.getSub()
          this.toast.showSuccess("Subtarea creada")
        })
        })
      }
      else{
        this.api.post('/Subtareas',this.subtarea)
        .subscribe((okay:any)=>{
          if(okay.categoriaId==5){
            let cotizacion:any={
              manoObra:0,
              administrativos:0,
              utilidad:0,
              impuestos:0,
              subtareaId:okay.id,
              definitivo:true,
              total:0
            }  
            this.api.post(`/Cotizaciones`,cotizacion)
            .subscribe((coti)=>{
            })  
          }
          this.subtarea={ fechaInicio:"",
          fechaFin:"",
          titulo:"",
          descripcion:"",
          estado:0,
          tratoId:"",
          categoriaId:""}
          this.getSub()
          this.toast.showSuccess("Subtarea creada")
        })
      }
    }
  }

  seeFull(full){
    if(full.categoriaId==5){
     this.router.navigate([`/cotizacion/${full.tratoId}/${full.id}`])
    }
    this.full=full
  }

  setEstado(s){
    if(s.categoriaId!=5){
      this.showModal=true;
      s.estado=1
      this.api.patch('/Subtareas',s).subscribe((okay)=>{
        this.toast.showInfo("Tarea terminada! Si deseas puedes asignar una nueva o retroalimentarla!")
      })
    }
    else{
      this.showModal=false;
      this.toast.showInfo("Esta es una cotizacion, debes llenarla en el formato")
    }
  }


  setDescription(full){
    this.api.patch('/Subtareas',full).subscribe((okay)=>{
      this.toast.showSuccess("¡Info. de descripcion actualizada!")
      this.full=okay
    })
  }

}