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
	+ ' style = "display:' + ((this.currentShowPolicy == 'SHOW_FREE') ? 'none' : 'block')
	+ '">Освободить</button></td></tr>');
    }

    if (response.refresh) {
      this.drones = response.drones;
    }
  },

  doShowDrones : function() {
    WORKER_COMM.doShowDrones({
      policy : this.SHOWPOLICY[this.currentShowPolicy],
      user : localStorage.id
    },
    this.templates.drone_show);
  },

  freeDrone : function(id) {
    WORKER_COMM.doSetState({
      state: {
	id : id,
	state : this.drones[id].state
      },
      nstate : this.STATES['Free']
    },
    this.templates.drone_user_free);
  },

  selectDrone : function(id) {
    $('#droneId' + this.selectedDrone).css("background-color", "#FFFFFF");
    $('#droneId' + id).css("background-color", "#DDDDDD");

    var specs = '';
    var specsArray = this.drones[id].model.specs;

    for (spec in specsArray) {
      specs += '<tr><td><b>' + spec + '</b></td><td>' + specsArray[spec] + '</td></tr>'
    }

    $('#selectDroneInfo').html('<h3>Информация о выделенном БПЛА</h3><table><tr><td><img src="'
    + this.drones[id].model.photo+'" width="100px" style="float:left"></img></td><td><b>Модель:</b> '
    + this.drones[id].model.name+'</td><tr><td colspan="2"><b>Характеристики</b></td></tr>'
    + specs + '</table>');

    this.selectedDrone = id;
  },

  unselectDrone : function() {
    $('#selectDroneInfo').empty();
  },

  showDroneName : function() {
    var pages = PAGE.dronePages;

    for(var i in pages) {
      $('#lDroneName' + pages[i]).html('Выбран БИТС: <b>' + this.drones[this.pickedDrone].name + '</b>');
    }
  },

  pickDrone : function(id) {
    $('#markers').empty();

    if(this.drones[id].name=='TestDroneObj') {
      var info = '<table>';
      info+='<tr><td>' + "<img src='object/m1.png'/>" + '</td><td>' + 'Эталон класса 1'+ '</td><td>' + 'Растр'+ '</td></tr>';
      info+='<tr><td>' + "<img src='object/m2.png'/>" + '</td><td>' + 'Эталон класса 2'+ '</td><td>' + 'Вектор'+ '</td></tr>';
      info+='</table>';

      $('#markers').html(info);
    }

    this.pickedDrone = id;
    var state = this.drones[id].state;

    this.fetchMaps(id);

    switch(state) {
      case this.STATES['Free'] :
      case this.STATES['Selected'] :
      case this.STATES['TaskCompleted'] :
	WORKER_COMM.doSetState({
	  state : {
	    id : id,
	    state : this.drones[id].state
	  },
	  nstate : this.STATES['Selected']
	},
	this.templates.drone_pick);
	break;
      case this.STATES['TaskGiven'] :
	PAGE.showPage('FlightTask');
	this.setButtons({
	  toEnable : ['#bFlightTaskInput']
	});
	this.showDroneName();
	break;

      case this.STATES['OnTask'] :
	WORKER_COMM.initMonitoring(id);
	this.showDroneName();
	break;
    }
    this.map.invalidateSize(false);
  },

  showResults : function(id) {
    PAGE.showPage('Result');
    this.setWriteState(this.WRITESTATES['OnComplete']);
    this.stopTheClocks(this.clocks);
    this.setButtons({
      toEnable : ['#bStart'],
      toDisable : ['#bStop']
    });

    if (this.drones[id].name !== 'TestDroneObj') {
      $('#distInfo').load('dist/' + this.drones[id].name + '.html');
      $('#distResult').show();
      $('#markersResult').hide();
    }
    else {
      $('#distResult').hide();
      $('#markersResult').show();
    }
  },

  getState : function(id) {
    return this.drones[id].state;
  },

  setState : function(id, nstate) {
    switch (nstate) {
      case this.STATES['Selected'] :
	PAGE.showPage('FlightTask');
	this.setButtons({
	  toEnable : ['#bFlightTaskInput']
	});
    this.setWriteState(this.WRITESTATES['WaitTask']);
	break;
      case this.STATES['TaskCompleted'] :
	this.showResults(id);
	break;
      case this.STATES['OnTask'] :
    this.clocks = CLOUDRONE.startTheClocks(this.timerClick, 1000);
    this.drones[id].taskTime = new Date().getTime();
	this.setWriteState(this.WRITESTATES['OnTask']);
	break;
    };

    this.setUser(id, this.drones[id].state, nstate);
    this.drones[id].state = nstate;
  },

  setUser : function(id, cstate, nstate) {
    if (cstate == this.STATES['Free'] && nstate == this.STATES['Selected']) {
      this.drones[id].user = localStorage.id;
    }
    else if (nstate == this.STATES['Free']) {
      this.drones[id].user = '';
    }
  },

  showUserName : function() {
    var pages = [PAGE.mainPage].concat([PAGE.dronePages]);

    for(var i in pages) {
      $('#lUserName' + pages[i]).html('Вы вошли как: <b>' + localStorage.id + '</b>');
      $('#lUserName' + pages[i]).show();
    }
  },

  setWriteState : function(nstate) {
    $().toastmessage('showNoticeToast', nstate);
    $('#droneState').html(nstate);
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
     this.map_markers = [];
     this.map.remove();
     this.clearMap();

     $.ajax({
        url: '../tiles_/'+'qwe'+id+'/map.txt',             // указываем URL и
        dataType : "text",                     // тип загружаемых данных
        success: function (data, textStatus) { // вешаем свой обработчик на функцию success
           CLOUDRONE.map_info = $.parseJSON(data);
           CLOUDRONE.map = L.map('taskMap').setView([0, 0], 0);
           L.tileLayer('../tiles_/'+'qwe'+id+'/{z}/{x}/{y}.png', {maxZoom: CLOUDRONE.map_info.maxZoom, noWrap:true}).addTo(CLOUDRONE.map);
           CLOUDRONE.map.markers = [];
        },
        error: function (xhr, status, error) {
           alert("Can not load map info: " + error);
        }
     });
  },

  onClickStart : function() {
    counter = 0;
    var pickedDrone = CLOUDRONE.pickedDrone;
    var drone = CLOUDRONE.drones[pickedDrone];
    var state = CLOUDRONE.getState(pickedDrone);

    function onSelected() {
      $('#markersInfo').empty();

      CLOUDRONE.setButtons({
	toEnable : ['#bStop'],
	toDisable : ['#bStart']
      });

      CLOUDRONE.clearTheClocks('#elapsedTime');
      CLOUDRONE.setWriteState(CLOUDRONE.WRITESTATES['WaitNavdata']);

      PAGE.showPage('Monitoring');

      CLOUDRONE.emptyNavdataInfo();
      CLOUDRONE.emptyCameraInfo();

      WORKER_COMM.doSetState({
	state : {
	  id : pickedDrone,
	  state : state
	},
	nstate : CLOUDRONE.STATES['OnTask'],
	driver : drone.driver
      },
      CLOUDRONE.templates.task_start);
    };

    switch (state) {
      case CLOUDRONE.STATES['TaskGiven'] :
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
	nstate : CLOUDRONE.STATES['TaskCompleted']
      },
      CLOUDRONE.templates.task_complete);

      CLOUDRONE.setWriteState(CLOUDRONE.WRITESTATES['OnComplete']);
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

    counter ++;

    $('#elapsedTime').html( addLeadZero(hours) + ':'
			  + addLeadZero(minutes) + ':'
			  + addLeadZero(seconds));

    if(CLOUDRONE.drones[CLOUDRONE.pickedDrone].name == 'TestDroneObj')
    {

      if(this.counter == 10)
      {
	//var info = '<tr><td><div id="videoMarker">Обнаруженные маркеры:</td></tr>';
	var info = '<tr><td>' + "<img src='object/1.png'/>" + '</td><td>' + 'Класс1'+ '</td></tr>';
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
    $('#sensorsInfo').html('');
  },

  emptyCameraInfo : function() {
    $('#droneCamera').html('');
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
   
  clearMap : function() {

    for(var i in this.map._layers) {
        if (this.map._layers[i]._path != undefined) {
            try {
                this.map.removeLayer(this.map._layers[i]);
            }
            catch(e) {
                console.log("problem with " + e + this.map._layers[i]);
            }
        }
    }
    for (var i = 0; i < this.map_markers.length; i++) {
        this.map.removeLayer(this.map_markers[i]);
    }
      /*
    if (this.map_polyline) {
        this.map.removeLayer(this.map_polyline);
    }
*/
    this.map_markers = [];
  },

  addAndDrawMarkers : function(id, numbers) {
    this.map_markers[id] = L.marker([numbers[1], numbers[0]]).addTo(this.map);
  },

  addAndDrawPolyline : function() {
    var markers = [];
    for (i in this.map_markers) {
        markers.push(this.map_markers[i].getLatLng());
    }
    L.polyline(markers, {color: 'red'}).addTo(this.map);
  },

  setFlightTask : function(flightTask) {
    if (flightTask) {
        this.drones[this.pickedDrone].flightTask = flightTask;
    }
    var commands = this.drones[this.pickedDrone].flightTask.commands;

    var patt = new RegExp(/^[ \t]*goto([ \t]*(\-)?(\d)*(\.)?(\d)*){4}[ \t]*$/);
    var markerId = 0;

    for(var id in commands) {
        if (commands[id].match(patt)) {
          var numbers = commands[id].trim().split(" ").slice(1);

          if (this.map_info) {
            for (var j = 0; j <= 1; j++) {
                numbers[j] = (parseFloat(numbers[j]) + this.map_info.zero[j]) / this.map_info.size * 360.0;
                while (numbers[j] < -180) numbers[j] += 360.;
                while (numbers[j] > 180) numbers[j] -= 360.;
            }

            this.addAndDrawMarkers(markerId ++, numbers);
          }
        }

    }

    this.addAndDrawPolyline();
    this.setButtons({
      toEnable : ['#bStart']
    });

    this.setWriteState(CLOUDRONE.WRITESTATES['WaitLaunch']);
  },

  doSetFlightTask : function(xml) {
    CLOUDRONE.drones[CLOUDRONE.pickedDrone].flightTask = {
        commands : $(xml).find('flightPlan').text().split('\n').filter(
            function(string){
                return !string.match(new RegExp(/^[ \t]*$/));
            })
    };

    WORKER_COMM.doSetFlightTask({
            drone : CLOUDRONE.pickedDrone,
            flightTask : CLOUDRONE.drones[CLOUDRONE.pickedDrone].flightTask
        },
        CLOUDRONE.templates.task_given);
  },

  loadFlightTask : function(evt) {
    var files = evt.target.files;
    for (var i = 0, f; f = files[i]; i++) {

      var reader = new FileReader();
      //CLOUDRONE.map.markers = [];

      reader.onload = function(e) {
          CLOUDRONE.clearMap();
	      CLOUDRONE.doSetFlightTask(e.target.result);
      };

      reader.readAsBinaryString(f);
    }
  }
}
