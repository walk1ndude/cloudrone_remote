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
	  WORKER_COMM.serviceResponse(response, initParams.responseFailure);
	}
      }
    );
  },
  
  serviceResponse : function(response, template) {
    switch (template.id) {
      case 'drone_show_success' :
	CLOUDRONE.unselectDrone();
	CLOUDRONE.showDrones(response);
	break;
	
      case 'drone_pick_success' :
	CLOUDRONE.setState(response.state.id, response.state.state);
	CLOUDRONE.setButtons({
	  toEnable : ['#bFligthTaskInput'],
	});
	break;
	
      case 'task_start_success' :
	CLOUDRONE.setState(response.state.id, CLOUDRONE.STATES['WaitNavdata']); // first wait for navdata, then send commands
	this.initMonitoring(CLOUDRONE.pickedDrone);
	break;
	
      case 'drone_user_free_success' :
	WORKER_COMM.doShowDrones({
	  policy : CLOUDRONE.SHOWPOLICY.SHOW_ALL,
	},
	CLOUDRONE.templates.drone_show);
	break;
	
      case 'task_stop_success' :
	CLOUDRONE.setState(response.state.id, response.state.state); 
	WORKER_COMM.doShowDrones({
	  policy : CLOUDRONE.SHOWPOLICY.SHOW_ALL,
	},
	CLOUDRONE.templates.drone_show);
	break;
    };
    
    var pages = template.pages;
    
    for (var id = 0; id < ((pages) ? pages.length : 0) ; id ++) {
      PAGE.showPage(pages[id]);
    }
  
    CLOUDRONE.map.invalidateSize(false);

    var domElements = template.domElements;
    
    for (var id = 0; id < ((domElements) ? domElements.length : 0) ; id ++) {
      
      var domElem = domElements[id].element;
      var method = domElements[id].method;
      var params = domElements[id].params;
      
      $(domElem)[method](params);
    }
    
    localStorage.id = (template.id == 'sign_success') ? response.id : localStorage.id;
    
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
  
  initFlightCommands : function(pickedDrone) {
    
    function initFlightCommand(cmd) {
      WORKER_COMM.flightCmdPublisher.publish(
	new ROSLIB.Message({
	  data : cmd
	})
      );
    };
    
    this.flightCmdPublisher = new ROSLIB.Topic({
        ros : this.ros,
        name : '/tum_ardrone/com',
        messageType : 'std_msgs/String'
    });
    
    cmds = CLOUDRONE.drones[pickedDrone].cmds;
    
    for (var i = 0; i < ((cmds) ? cmds.length : 0); i++) {
      initFlightCommand(cmds[i]);
    }
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
        CLOUDRONE.setState(pickedDrone, 'OnTask'); // Begin task
      }
      
      var data = navdata.data;
      var value;
      var isValueObject;
      
      for(var key in data) {
        isValueObject = data[key] instanceof Object;
        value = (isValueObject) ? data[key].states[message[key]] : message[key];
        CLOUDRONE.printNavdataInfo(((isValueObject) ? data[key].name : data[key]), value);
      }
    });
    
    var video = model.video;
   
    $('#droneCamera').html("");
    
    this.viewer = new MJPEGCANVAS.Viewer({
        divID: 'droneCamera',
        host: this.mjpeghostname,
        port: this.mjpegport,
        width: video.width,
        height: video.height,
        topic: namespace + video.topic
    });
    
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
  },
  
  resultCancel : function() {
    WORKER_COMM.markerListener.unsubcribe();
  }
}
