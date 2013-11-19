var WORKER_COMM = {
  
  roshostname : 'localhost',
  mjpeghostname : 'localhost',
  rosport : 8080,
  mjpegport : 8081,
  
  initRos: function(routes) {
    this.roshostname = ((routes) ? routes.roshostname : this.roshostname) || this.roshostname;
    this.rosport = ((routes) ? routes.rosport : this.rosport) || this.rosport;
    this.mjpeghostname = ((routes) ? routes.mjpeghostname : this.mjpeghostname) || this.mjpeghostname;
    this.mjpegport = ((routes) ? routes.mjpegport : this.mjpegport) || this.mjpegport;
    
    this.ros = new ROSLIB.Ros({
      url : 'ws://' + this.roshostname + ':' + this.rosport
    });
  },
  
  initService : function(initParams) {
    var client = new ROSLIB.Service(initParams.serviceObject);
    
    client.callService(new ROSLIB.ServiceRequest(initParams.requestObject),
      function(response) {
	if (!response.error) { // 'cause 0 is a success
	  WORKER_COMM.serviceResponse(response, initParams.responseSuccess);
	}
	else {
	  switch (response.error) {
	    case 254 :
	      WORKER_COMM.serviceResponse(response, CLOUDRONE.templates['sign_on']['success']);
	      break;
	      
	    case 255 :
	      WORKER_COMM.serviceResponse(response, CLOUDRONE.templates['sign_off']['success']);
	      break;
	      
	    default :
	      WORKER_COMM.serviceResponse(response, initParams.responseFailure);
	      break;
	  }
	}
      }
    );
  },
  
  serviceResponse : function(response, template) {
    switch (template.id) {
      
      case 'sign_on_success' :
	localStorage.id = response.id;
	CLOUDRONE.showUserName();
	break;
      
      case 'sign_off_success' :
	localStorage.id = '';
	break;
	
      case 'sign_on_failure' :
	localStorage.id = '';
	break;
      
      case 'drone_show_success' :
	CLOUDRONE.unselectDrone();
	CLOUDRONE.showDrones(response);
	break;
	
        case 'drone_pick_success' :
	CLOUDRONE.setState(response.state.id, response.state.state);
    //set flight task from db, if no commands -> nothing to set
    if (response.flightTask.commands.length != 0) {
        CLOUDRONE.setFlightTask(response.flightTask);
        CLOUDRONE.setState(response.state.id, CLOUDRONE.STATES['TaskGiven']);
    } else {
        CLOUDRONE.setButtons({
            toDisable : ['#bStart']
        });
    }
	CLOUDRONE.showDroneName();
	break;

      case 'task_given_success' :
    CLOUDRONE.setState(response.state.id, response.state.state);
    //set flight task from xml-file
    CLOUDRONE.setFlightTask();
	break;

      case 'task_start_success' :
	CLOUDRONE.setState(response.state.id, CLOUDRONE.STATES['WaitNavdata']); // first wait for navdata, then send commands
	this.initMonitoring(CLOUDRONE.pickedDrone);
	break;
	
      case 'drone_user_free_success' :
	CLOUDRONE.doShowDrones();
	break;
	
      case 'task_stop_success' :
	CLOUDRONE.setState(response.state.id, response.state.state); 
	CLOUDRONE.doShowDrones();
	break;
    };

    PAGE.showPage(template.page);
    PAGE.callDomMethods(template.domElements);
  
    CLOUDRONE.map.invalidateSize(false);
    
    for (var id = 0; id < ((template.alerts) ? template.alerts.length : 0) ; id ++) {
      alert(template.alerts[id]);
    }
  },
  
  doSign : function(input, template) {
    this.initService({
      serviceObject : {
	ros : this.ros,
	name : '/cloudrone/sign',
	serviceType : 'cloudrone/Auth'
      },
      requestObject : {
	user : {
	  id : input.user.id,
	  password : input.user.password || ''
	},
	isPageUpdate : input.isPageUpdate
     },
      responseSuccess : template.success,
      responseFailure : template.failure
    });
    
    return false;
  },
  
  doRegister : function(input, template) {
    this.initService({
      serviceObject : {
	ros : this.ros,
	name : '/cloudrone/reg',
	serviceType : 'cloudrone/Auth'
      },
      requestObject : input,
      responseSuccess : template.success,
      responseFailure : template.failure
    });
    
    return false;
  },
  
  doShowDrones : function(input, template) {
    this.initService({
      serviceObject : {
	ros : this.ros,
	name : '/cloudrone/get_drones',
	serviceType : 'cloudrone/GetDrones'
      },
      requestObject : {
	policy : input.policy,
	user : input.user || localStorage.id
      },
      responseSuccess : template.success,
      responseFailure : template.failure
    });
  },
  
 doSetState : function(input, template) { 
    this.initService({
      serviceObject : {
	ros : this.ros,
	name : '/cloudrone/set_state',
	messageType : 'cloudrone/SetState'
      },
      requestObject : {
	state : input.state,
	nstate : input.nstate,
	driver : input.driver || '',
	user : input.user || localStorage.id
      },
      responseSuccess : template.success,
      responseFailure : template.failure
    });
 },

 doSetFlightTask : function(input, template) {
    this.initService({
        serviceObject : {
            ros : this.ros,
            name : '/cloudrone/set_flight_task',
            messageType: 'cloudrone/SetFlightTask'
        },
        requestObject : {
            drone : input.drone,
            flightTask : input.flightTask
        },
        responseSuccess: template.success,
        responseFailure: template.failure
    })
 },
  
 doKillNodes : function(input, template) {
    this.initService({
      serviceObject : {
	ros : this.ros,
	name : '/cloudrone/kill_nodes',
	messageType: 'cloudrone/KillNodes'
      },
      requestObject : {
	fileName: input.user,
	driver: input.drone
     },
      responseSuccess : template.success,
      responseFailure : template.failure
    })
  },
  
  initMonitoring : function(pickedDrone) {
    
    var model = CLOUDRONE.drones[pickedDrone].model['topics'];
    var namespace = '/drone' + pickedDrone;
    var navdata = model.navdata;
 
    this.navdataListener = new ROSLIB.Topic({
      ros : this.ros,
      name : namespace + navdata.topic,
      messageType : navdata.messageType
    });
    
    this.navdataListener.subscribe(function(message) {
      CLOUDRONE.emptyNavdataInfo();
      pickedDrone = CLOUDRONE.pickedDrone;
      
      if (CLOUDRONE.drones[pickedDrone].state === CLOUDRONE.STATES['WaitNavdata']) {
        CLOUDRONE.setState(pickedDrone, CLOUDRONE.STATES['OnTask']); // Begin task
      }
      
      var data = navdata.data;
      var value;
      var isValueObject;
      
      for(var key in data) {
        isValueObject = data[key] instanceof Object;
        if (isValueObject) {
            value = data[key].states[message[key]];
            if (key === 'state') {
                if (CLOUDRONE.drones[pickedDrone].navdataState === 'посадка' && value === 'на земле') {
                    CLOUDRONE.setWriteState(CLOUDRONE.WRITESTATES['WaitComplete']);
                    WORKER_COMM.monitoringCancel();
                }
                CLOUDRONE.drones[pickedDrone].navdataState = value;
            }
        }
        else {
            value = message[key];
        }
        CLOUDRONE.printNavdataInfo(((isValueObject) ? data[key].name : data[key]), value);
      }
    });
    
    var video = model.video;
    
    this.viewer = new MJPEGCANVAS.Viewer({
        divID: 'droneCamera',
        host: this.mjpeghostname,
        port: this.mjpegport,
        width: video.width,
        height: video.height,
        topic: namespace + video.topic
    });

    if (this.stateWatcher) {
      this.stateWatcher.unsubscribe();
    }

    this.stateWatcher = new ROSLIB.Topic({
      ros : this.ros,
      name : 'get_state',
      messageType : 'cloudrone/State'
    });
    
    this.stateWatcher.subscribe(function(message) {
      CLOUDRONE.setState(message.id, message.state);
    });
  },
  
  monitoringCancel : function() {
    CLOUDRONE.stopTheClocks(CLOUDRONE.clocks);
    WORKER_COMM.navdataListener.unsubscribe();
    WORKER_COMM.viewer = null;
  },
  
  initResults : function() {
 
    this.markerListener = new ROSLIB.Topic({
      ros : this.ros,
      name : '/cloudrone/objects',
      messageType : 'cloudrone/Object'
    });
  
    this.markerListener.subscribe(function(markers) {
      CLOUDRONE.printMarkers(markers);
    });
  }
}
