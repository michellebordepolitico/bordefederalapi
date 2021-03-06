// Import node modules for API operation
var crawler = require('crawler');
var url = require('url');
var fs = require('fs');
var async = require('async');

// Started module crawler
module.exports = {
  info_basic_get_sil:function (req, res, app, return_info_basic){
    var legislstors_all = [];
     var c = new crawler({
        forceUTF8:true,
		    maxConnections : 1000000,
		    callback : function (error, result, done) {

            var $=result.$;
			    	var uri = result.options.uri;

			    	id=uri.split("Referencia=")[1]; // Get Id Legislator
			    	dip={}; //Object for save dates legislators

            console.log("Updating legislator information await..."); //Print Message Await
            console.log("Find " + id); //Print Message with result and legislator Id

			    	$('table[border="1"]').eq(0).find(".tdcriterio").each(function(index, elem) {
			    		cat=$(elem).text();
			    		valelem=$(elem).parent("tr").find(".tddatosazul");
              val=$(elem).parent("tr").find(".tddatosazul").text();

			    		if (cat.indexOf("Nombre")>-1) {

			    			val=$(elem).parent("tr").find(".tddatosazul").find("b").text();//.find("b").text();
			    			vals=val.split(", ");

			    			dip["legislator_name_sil"]=vals[1]+" "+vals[0];
			    			dip["legislator_last_name_sil"]=vals[0];
			    			dip["legislator_first_name_sil"]=vals[1];

			    		}
			    		else if (cat.indexOf("Partido")>-1) { //
			    			dip["legislator_party_sil"]=val;
			    		}else if (cat.indexOf("Estatus")>-1) { //
			    			dip["legislator_status_sil"]=val;
			    		}
			    		else if (cat.indexOf("Nacimiento")>-1) { // name
                ages=val.split('Fecha: ').join(',').split('Entidad:').join(',').split('Ciudad:').join(',').split(',')

                dip["legislator_age_sil"]=ages[1];

                if(ages[2]==" "){
                  dip["legislator_state_sil"]="S/E";
                }else{
                  dip["legislator_state_sil"]=ages[2];
                }

                if(ages[3]==" "){
                  dip["legislator_city_sil"]="S/C";
                }else{
                  dip["legislator_city_sil"]=ages[3];
                }
			    		}

			    		else if (cat.indexOf("Correo")>-1) { // name
			    			dip["legislator_mail_sil"]=val;
			    		}
              else if (cat.indexOf("Suplente")>-1) { // name
                var hrefSupl = $(elem).parent("tr").find("a").attr("href");
                idSupl=hrefSupl.split("Referencia=")[1];
                var resSupl = idSupl.slice(0, 7);
			    			dip["legislator_supl_sil"]=resSupl;
			    		}
              else if (cat.indexOf("Principio de")>-1) { // name
			    			if (val.indexOf("Relativa")>-1) {
			    				val="MR";
			    			}
			    			else if (val.indexOf("Minor")>-1) {
			    				val="PM";
			    			}
			    			else if (val.indexOf("Proporcional")>-1) {
			    				val="RP";
			    			}
			    			dip["legislator_election_sil"]=val;
			    		}
			    		else if (cat.indexOf("Zona")>-1) { // name
			    			val=$(elem).parent("tr").find(".tddatosazul").html();
			    			vals=val.split("<br>")
			    			vals2=vals[0].split("Entidad: ")
			    			dip["legislator_zone_sil"]=vals2[1];
			    		}
              else if (cat.indexOf("Toma de")>-1) { // name
                dip["legislator_protest_sil"]=val;
              }

			    	});

					num=0;
					tit="";
          dip["legislator_commission_sil"]=[];
					$("img").each(function(index,elem) {
						src=$(elem).attr("src");
					});
					$('table[border="1"]').eq(1).find("tr").each(function(index, elem) {
						if(num==0){
							tit=$(elem).find("td").eq(0).text();
						}
						else{
							if(tit=="Comisión"){
								all=$(elem).text();
					    		puesto=cleanText( $(elem).find("td").eq(1).text() );
					    		comision=cleanText( $(elem).find("td").eq(0).text() );
                  status=$(elem).find("td").eq(4).text() ;
                  fechaIn=$(elem).find("td").eq(2).text() ;
                  fechaFn=$(elem).find("td").eq(3).text() ;
                if( comision.indexOf("(Com. Perm.)") == -1 ){
                  comision=comision.replace(" (C. Diputados)",",").replace(" (C. Senadores)",",");
                  arr_commission = comision.split(",");
                    dip["legislator_commission_sil"].push({legislator_post_sil:puesto, legislator_namecom_sil:arr_commission[0], legislator_status_sil:status, commision_fechaIn:fechaIn, commision_fechaFn:fechaFn });
                }
							}
						}
				      num+=1;
			    	});

            num=0;
            tit="";
            dip["legislator_organ_sil"]=[];
            $('table[border="1"]').eq(2).find("tr").each(function(index, elem) {
              // tit=$(elem).find("td");

              if(num==0){
                tit=$(elem).find("td").eq(0).text();
              }else{
              if(tit=="Organo"){
                all=$(elem).text();
                  puesto=cleanText( $(elem).find("td").eq(1).text() );
                  organo=cleanText( $(elem).find("td").eq(0).text() );
                  status=$(elem).find("td").eq(4).text() ;
                  fechaIn=$(elem).find("td").eq(2).text() ;
                  fechaFn=$(elem).find("td").eq(3).text() ;
                  if( organo.indexOf("(Com. Perm.)") == -1 ){
                    organo = organo.replace(" (C. Diputados)",",").replace(" (C. Senadores)",",");
                    arr_org = organo.split(",");
                      dip["legislator_organ_sil"].push({legislator_post_sil:puesto, legislator_nameorg_sil:arr_org[0], legislator_status_sil:status, org_fechaIn:fechaIn, org_fechaFn:fechaFn });
                  }
                }
              }
                num+=1;
              });

			    	num=0;
			    	tit="";
			    	dip["legislator_trajectory_sil"]=[];
			    	already={};
			    	$('table[width="100%"]').each(function(index, elem) {

			    			rub="";
			    			if (index==0) {rub="administrativa";}
			    			if (index==1) {rub="política";}
			    			if (index==2) {rub="académica";}
			    			if (index==3) {rub="empresarial";}
			    			if (index==3) {rub="otros";}

							tit=$(elem).find("td").eq(0).text();
							trabajo="";
							if(tit=="Del año"){

								$(elem).find("tr").each(function(index2, elem2) {

									starts=$(elem2).find(".tddatosazul").eq(0).text();
									ends=$(elem2).find(".tddatosazul").eq(1).text();
									trabajo=$(elem2).find(".tddatosazul").eq(2).text();
									if(trabajo.length>2 && !already[trabajo]){
										already[trabajo]=1;
                    if(starts == ""){
                      starts = "N/F";
                    }
                    if(ends == ""){
                      ends = "N/F";
                    }
										dip["legislator_trajectory_sil"].push({ from:starts, to:ends , legislator_description_sil: trabajo });
									}

								});

							}
						num+=1;
			    	});

			    	dip["legislator_image_sil"]=$('img[alt="Foto del Legislador"]').attr("src");
			    	dip["legislator_link_sil"]=uri;
            dip["legislator_score_sil"]=0;
  					dip["legislator_legislature_sil"]="LXIII";
  					//dip["legislator_sil_id"]=id;

                  app.models[ "legislators" ].update({id_legislator_sil:id},dip).exec(function afterwards(err, updated){//{trayectoria:dip.trayectoria , silid:dip.uriid}).exec(function afterwards(err, updated){
                  //console.log('Updated Legislator');
              });
			    }
			});

			////////////
      app.models[ "legislators" ].find().exec(function (err, dips){
            if (err) {
                console.log("Error ----> ",err);
            }
            else{
                console.log("legislators found", dips.length);
            }
              for (var i = 0; i < dips.length; i++) {
                legislstors_all.push(dips[i].id_legislator_sil);
              }

                for(i=0; i<legislstors_all.length; i++){
                  c.queue("http://sil.gobernacion.gob.mx/Librerias/pp_PerfilLegislador.php?SID=&Referencia="+legislstors_all[i]);
                }
            return_info_basic({Legislators_Updated:legislstors_all.length})
        });
  },
}

function cleanText(txt){
   txt=txt.trim();
   txt=txt.replace("Sen. ", "");
   txt=txt.replace("Dip. ", "");
   txt=txt.replace("\r", "");
   txt=txt.replace("\n", "");
   txt.replace("\t", "");
   txt.replace(" (C. Diputados)", "");
   txt.replace(" (C. Senadores)", "");
   txt=txt.trim();
   return txt;
}
