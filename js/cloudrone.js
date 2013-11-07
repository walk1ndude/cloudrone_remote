var CLOUDRONE = {
  
  KOSTILEV : 360.0/20.0,
  
  selectedDrone : -1,
  pickedDrone : -1,
  
  selectedMarker : 0,
  markerPopup : null,
  
  counter : 0,
  interval : null,
  
  markers : {},
  
  drones : {},
  
  showDrones : function(response) {
    var drones = response.drones;
  
    $('#droneTable').html('<tr><th>Фото</th><th>Название</th><th>Модель</th><th>Расположение</th><th>Статус</th><th colspan="2"></th></tr>');
  
    for (var i = 0; i < drones.length; i ++ ) {
      
      drone = drones[i];
      
      id = drone.id;
      drone.model = eval(drones[i].model);
      
      var isOwned = drone.user == localStorage.id;
      var isFree = drone.state == this.STATES['Free'];
      var isOnTask = drone.state == this.STATES['OnTask'];
     
      $('#droneTable').append('<tr id="droneId' + id
	+ '" onClick="CLOUDRONE.selectDrone(' + id + ');"><td align="center"><img src="'
	+ drone.model.photo +'" width="50px"></img></td><td align="center">'
	+ drone.name + '</td><td align="center">'
	+ drone.model.name +'</td><td align="center">'
	+ drone.location +'</td><td align="center">'
	+ (isFree ? 'Свободен' : 'Занят') + '</td><td align="center"><button onClick="CLOUDRONE.pickDrone('
	+ id + ');" ' + ((isOwned || isFree) ? '' : 'disabled')
	+ '>Выбрать</button></td><td align="center"><button onClick="CLOUDRONE.freeDrone('
	+ id + ');" ' + ((isOwned) ? '' : 'disabled')
	+ ' style = "display:' + ((CLOUDRONE.currentShowPolicy == 'SHOW_FREE') ? 'none' : 'block')
	+ '">Освободить</button></td></tr>');
    }
      
    if (response.refresh) {
      this.drones = response.drones;
    }
  },
  
  doShowDrones : function() {
    WORKER_COMM.doShowDrones({
      policy : CLOUDRONE.SHOWPOLICY[CLOUDRONE.currentShowPolicy],
      user : localStorage.id,
    },
    CLOUDRONE.templates.drone_show);
  },
  
  freeDrone : function(id) {
    WORKER_COMM.doSetState({
      state: {
	id : id,
	state : CLOUDRONE.drones[id].state
      },
      nstate : CLOUDRONE.STATES['Free'],
    },
    CLOUDRONE.templates.drone_user_free);
  },

  selectDrone : function(id) {
    $('#droneId' + CLOUDRONE.selectedDrone).css("background-color", "#FFFFFF");
    $('#droneId' + id).css("background-color", "#DDDDDD");
  
    var specs = '';
    var specsArray = CLOUDRONE.drones[id].model.specs;
      
    for (spec in specsArray) {
      specs += '<tr><td><b>' + spec + '</b></td><td>' + specsArray[spec] + '</td></tr>'
    }

    $('#selectDroneInfo').html('<h3>Информация о выделенном БПЛА</h3><table><tr><td><img src="'
    + CLOUDRONE.drones[id].model.photo+'" width="100px" style="float:left"></img></td><td><b>Модель:</b> '
    + CLOUDRONE.drones[id].model.name+'</td><tr><td colspan="2"><b>Характеристики</b></td></tr>'
    + specs + '</table>');
  
    CLOUDRONE.selectedDrone = id;
  },
  
  unselectDrone : function() {
    $('#selectDroneInfo').empty();
  },
  
  showDroneName : function() {
    var pages = PAGE.dronePages;
    
    for(var i in pages) {
      $('#lDroneName' + pages[i]).html('Выбран БИТС: <b>' + CLOUDRONE.drones[CLOUDRONE.pickedDrone].name + '</b>');
    }
  },
  
  pickDrone : function(id) {
    $('#markers').empty();
       
    if(CLOUDRONE.drones[id].name=='TestDroneObj') {
      var info = '<table>';
      info+='<tr><td>' + "<img src='object/m1.png'/>" + '</td><td>' + 'Эталон класса 1'+ '</td><td>' + 'Растр'+ '</td></tr>';
      info+='<tr><td>' + "<img src='object/m2.png'/>" + '</td><td>' + 'Эталон класса 2'+ '</td><td>' + 'Вектор'+ '</td></tr>';
      info+='</table>';
      
      $('#markers').html(info);
    }
   
    this.pickedDrone = id;
    var state = CLOUDRONE.drones[id].state;
    
    CLOUDRONE.fetchMaps(id);
    
    switch(state) {
      case CLOUDRONE.STATES['Free'] :
	WORKER_COMM.doSetState({
	  state : {
	    id : id,
	    state : CLOUDRONE.drones[id].state
	  },
	  nstate : CLOUDRONE.STATES['Selected'],
	},
	CLOUDRONE.templates.drone_pick);
	break;
      case CLOUDRONE.STATES['Selected'] :
	PAGE.showPage('FlightTask');
	CLOUDRONE.setButtons({
	  toEnable : ['#bFlightTaskInput']
	});
	CLOUDRONE.showDroneName();
	$('#droneState').html(CLOUDRONE.WRITESTATES['WaitTask']);
	break;
      case CLOUDRONE.STATES['OnTask'] :
	WORKER_COMM.initMonitoring(id);
	CLOUDRONE.showDroneName();
	break;
      case CLOUDRONE.STATES['TaskCompleted'] :
	CLOUDRONE.showResults(id);
	CLOUDRONE.showDroneName();
	break;
    }
    CLOUDRONE.map.invalidateSize(false);
  },
  
  showResults : function(id) {
    PAGE.showPage('Result');
    $('#droneState').html(CLOUDRONE.WRITESTATES['OnComplete']);
    CLOUDRONE.stopTheClocks(CLOUDRONE.clocks);
    CLOUDRONE.setButtons({
      toEnable : ['#bStart'],
      toDisable : ['#bStop']
    });
    
    if (CLOUDRONE.drones[id].name !== 'TestDroneObj') {
      $('#distInfo').load('dist/' + CLOUDRONE.drones[id].name + '.html');
    }
    else {
      $('#distInfo').html('');
    }
  },
  
  getState : function(id) {
    return CLOUDRONE.drones[id].state;
  },
  
  setState : function(id, nstate) {
    switch (nstate) {
      case CLOUDRONE.STATES['Selected'] :
	PAGE.showPage('FlightTask');
	CLOUDRONE.setButtons({
	  toEnable : ['#bFlightTaskInput']
	});
	break;
      case CLOUDRONE.STATES['TaskCompleted'] :
	CLOUDRONE.showResults(id);
	break;
      case CLOUDRONE.STATES['OnTask'] :
	//CLOUDRONE.initFlightCommands(id);
	$('#droneState').html(CLOUDRONE.WRITESTATES['OnTask']);
	break;
    };
    
    CLOUDRONE.setUser(id, CLOUDRONE.drones[id].state, nstate);
    CLOUDRONE.drones[id].state = nstate;
  },

  setUser : function(id, cstate, nstate) {
    if (cstate == CLOUDRONE.STATES['Free'] && nstate == CLOUDRONE.STATES['Selected']) {
      CLOUDRONE.drones[id].user = localStorage.id;
    }
    else if (nstate == CLOUDRONE.STATES['Free']) {
      CLOUDRONE.drones[id].user = '';
    }
  },
  
  showUserName : function() {
    var pages = ['Main', 'FlightTask', 'Monitoring', 'Result'];
    
    for(var i in pages) {
      $('#lUserName' + pages[i]).html('Вы вошли как: <b>' + localStorage.id + '</b>');
      $('#lUserName' + pages[i]).show();
    }
  },
  
  doSign : function() {
    return WORKER_COMM.doSign({
	user : {
	  id : $('#signId').val(),
	  password : $('#signPassword').val()
	},
	isPageUpdate : false
     },
      this.templates.sign_on);
  },
  
  doSignOnReload : function() {
    if (localStorage.id !== '') {
      WORKER_COMM.doSign({
	user : {
	id : localStorage.id
	},
	isPageUpdate : true
      }, this.templates.sign_on);
    }
  },
  
  doRegister : function() {
    return WORKER_COMM.doRegister({
      user : {
	  id : $('#registerId').val(),
	  password : $('#registerPassword').val()
	}
      },
      this.templates.reg);
  },
  
  fetchMaps : function(id) {
     CLOUDRONE.map.remove();
     //CLOUDRONE.map.layers=[];
     
     $.ajax({
        url: '../tiles_/'+'qwe'+id+'/map.txt',             // указываем URL и
        dataType : "text",                     // тип загружаемых данных
        success: function (data, textStatus) { // вешаем свой обработчик на функцию success
           var map_info = jQuery.parseJSON(data);
           CLOUDRONE.map_info = map_info;
           CLOUDRONE.map = L.map('taskMap').setView([0, 0], 0);
           L.tileLayer('../tiles_/'+'qwe'+id+'/{z}/{x}/{y}.png', {maxZoom: map_info.maxZoom, noWrap:true}).addTo(CLOUDRONE.map);
           CLOUDRONE.map.markers = [];
        },
        error: function (xhr, status, error) {
           alert("Can not load map info: " + error);
        }
     });
  },

  onClickStart : function() {
    counter=0;
    var pickedDrone = CLOUDRONE.pickedDrone;
    var drone = CLOUDRONE.drones[pickedDrone];
    var state = CLOUDRONE.getState(pickedDrone);
    
    function onSelected() {
      $('#markersInfo').empty();
      
      CLOUDRONE.setButtons({
	toEnable : ['#bStop'],
	toDisable : ['#bStart']
      });
     
      drone.taskTime = new Date().getTime();
      
      CLOUDRONE.clearTheClocks('#elapsedTime');
      $('#droneState').html(CLOUDRONE.WRITESTATES['WaitNavdata']);
	
      PAGE.showPage('Monitoring');
      
      WORKER_COMM.doSetState({
	state : {
	  id : pickedDrone,
	  state : state
	},
	nstate : CLOUDRONE.STATES['OnTask'],
	driver : drone.driver
      },
      CLOUDRONE.templates.task_start);
      
      CLOUDRONE.clocks = CLOUDRONE.startTheClocks(CLOUDRONE.timerClick, 1000);
     
    };
    
    switch (state) {
      case CLOUDRONE.STATES['Selected'] :
	onSelected();
	break;
      case CLOUDRONE.STATES['TaskCompleted'] :
	onSelected();
	break;
    };
  },
  
  onClickStop : function() {
    var pickedDrone = CLOUDRONE.pickedDrone;
    var drone = CLOUDRONE.drones[pickedDrone];
    var state = CLOUDRONE.getState(pickedDrone);
    
    function onTask() {
      
      CLOUDRONE.stopTheClocks(CLOUDRONE.clocks);
      
      CLOUDRONE.setButtons({
	toEnable : ['#bStart'],
	toDisable : ['#bStop']
      });
     
      WORKER_COMM.doSetState({
	state : {
	  id : pickedDrone,
	  state : state
	},
	nstate : CLOUDRONE.STATES['TaskCompleted'],
      },
      CLOUDRONE.templates.task_complete);
      
      $('#droneState').html(CLOUDRONE.WRITESTATES['OnComplete']);
      PAGE.showPage('Result');
    }
    
    switch (state) {
      
      case CLOUDRONE.STATES['OnTask'] :
	onTask();
	break;
    };
  },
  
  
  timerClick : function() {
    var pickedDrone = CLOUDRONE.pickedDrone;
    var drone = CLOUDRONE.drones[pickedDrone];
    
    var currentTime = new Date().getTime() - drone.taskTime;
    
    var timeSeconds = Math.floor(currentTime / 1000);
    
    var hours = Math.floor(timeSeconds / 3600);
    var minutes = Math.floor((timeSeconds % 3600) / 60);
    var seconds = Math.floor((timeSeconds % 3600) % 60);
    
    function addLeadZero(number) {
      return ((number < 10) ? '0' : '') + number;
    }
    
    counter++;
    
    $('#elapsedTime').html( addLeadZero(hours) + ':'
			  + addLeadZero(minutes) + ':'
			  + addLeadZero(seconds));
    
    if(CLOUDRONE.drones[CLOUDRONE.pickedDrone].name=='TestDroneObj')
    {
    
      if(this.counter == 10)
      {
	var info = '<tr><td><div id="videoMarker">Обнаруженные маркеры:</td></tr>';
      info += '<tr><td>' + "<img src='object/1.png'/>" + '</td><td>' + 'Класс1'+ '</td></tr>';
      $('#markersInfo').append(info);
      }
      
      
      if(this.counter == 12)
      {
      var info = '<tr><td>' + "<img src='object/2.png'/>" + '</td><td>' + 'Класс2'+ '</td></tr>';
      $('#markersInfo').append(info);
      }
    }
    
  },
  
  startTheClocks : function(method, interval, params) {
    return setInterval(function(){
      method(params);
    }, interval); 
  },
  
  stopTheClocks : function(clocks) {
    clearInterval(clocks);
  },
  
  clearTheClocks : function(clocks) {
    $(clocks).html('00:00:00');
  },
  
  setButtons : function(buttons) {
    var bEnable = buttons.toEnable;
    var bDisable = buttons.toDisable;
    
    for (var i = 0; i < ((bEnable) ? bEnable.length : 0); i ++) {
      $(bEnable[i]).removeAttr('disabled');
    }
    for (var i = 0; i < ((bDisable) ? bDisable.length : 0); i ++) {
      $(bDisable[i]).attr('disabled', 'disabled');
    }
  },
  
  emptyNavdataInfo : function() {
    $('#sensorsInfo').empty();
  },
  
  printNavdataInfo : function(data, value) {
  $('#sensorsInfo').append('<tr><td>' + data + '</td><td>'
    + (isNaN(value) ? value : Math.round(value * 1000) / 1000)  + '</td></tr>'); 
  },
  
  printMarkers : function(marker) {
    //$('#markersInfo').empty();
    
    var info = '<tr><td><div id="videoMarker">Обнаруженные маркеры:</td></tr>';
    /*for(field in marker) {
      if (marker.hasOwnProperty(field) && field != 'view') {
	info += '<tr><td>' + field + '</td><td>' + marker[field] + '</td></tr>';
      }
    }*/
    info += '<tr><td>' + "<img src='object/"+marker["viewid"]+".png'/>" + '</td><td>' + (marker["classid"] == 1 ? 'Класс1':'Класс2')+ '</td></tr>';
   // $('#markersInfo').append(info);
  },
  
  loadFlightTask : function(evt) {
    var patt = new RegExp(/^[ \t]*goto([ \t]*(\-)?(\d)*(\.)?(\d)*){4}[ \t]*$/);
    
    function sendCommands(flightPlan) {

     for(i in CLOUDRONE.map._layers) {
         if(CLOUDRONE.map._layers[i]._path != undefined) {
	    CLOUDRONE.map.removeLayer(CLOUDRONE.maps.taskMap._layers[i]);
	 }
      }
	
      CLOUDRONE.drones[CLOUDRONE.pickedDrone].cmds = ["c start"];
	  
      if (flightPlan.length > 0) {
	  var flightCmds = flightPlan.split('\n');
	  var markerId = 0;
	  
	  for (var c = 0; c < flightCmds.length; c++) {
	    if (!!flightCmds[c]) {
	         
	      if (flightCmds[c].match(patt)) { // if goto numbers
		var numbers = flightCmds[c].trim().split(" ");
		
		if (CLOUDRONE.map_info)
		{
		  for (var j = 1; j <= 2; j++) {
		    numbers[j] = (parseFloat(numbers[j]) + CLOUDRONE.map_info.zero[j-1]) / CLOUDRONE.map_info.size * 360.0;
		    while (numbers[j] < -180) numbers[j] += 360.;
		    while (numbers[j] > 180) numbers[j] -= 360.;
		  }
		  CLOUDRONE.map.markers[markerId ++] = L.marker([numbers[2], numbers[1]]).addTo(CLOUDRONE.map);
		//CLOUDRONE.maps.taskMap.markers[markerId ++] = L.marker([numbers[3]*CLOUDRONE.KOSTILEV, //numbers[4]*CLOUDRONE.KOSTILEV]).addTo(CLOUDRONE.maps.taskMap);
		}
	      }
	      
	      CLOUDRONE.drones[CLOUDRONE.pickedDrone].cmds.push("c " + flightCmds[c]);
	    }
	  }
	}
    }
    
    function drawPolyline() {
      var map = CLOUDRONE.map;
      var markers = [];
      
      for (var i = 0; i < map.markers.length; i++) {
	markers.push(map.markers[i].getLatLng());
      }
      
      L.polyline(markers,{color: 'red'}).addTo(map);
    }
    
    var files = evt.target.files;
    for (var i = 0, f; f = files[i]; i++) {

      var reader = new FileReader();
      CLOUDRONE.map.markers = [];
      
      reader.onload = function(e) {
	  var xml = e.target.result;
	  sendCommands($(xml).find("flightPlan").text()); 
	  drawPolyline();
	  var objectList = $(xml).find("objectList").text();
      };
      reader.readAsBinaryString(f);
    }
    
    CLOUDRONE.setButtons({
      toEnable : ['#bStart'],
    });
    
    $('#droneState').html(CLOUDRONE.WRITESTATES['WaitLaunch']);
  }
}
