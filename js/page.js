var PAGE = { 
  pages : {},
  cpage : '',
  
  showPage : function(npage) {
    if (!!PAGE.cpage) {
      PAGE.pages[this.cpage].header.hide();
      PAGE.pages[this.cpage].content.hide();
    }
    
    PAGE.pages[npage].header.show();
    PAGE.pages[npage].content.show();
    
    if (npage == 'FlightTask' || npage == 'Monitoring' || npage == 'Result') {
      $('#droneStateControl').show();
    }
    else {
      $('#droneStateControl').hide();
    }
    
    if (npage == 'SelectDrone') {
      var pickedDrone = CLOUDRONE.pickedDrone;
      
      if (pickedDrone != -1) {
	var state = CLOUDRONE.drones[pickedDrone].state;
      
	if (state == CLOUDRONE.STATES['TaskCompleted']) {
	  
	  WORKER_COMM.doSetState({
	    state : {
	      id : pickedDrone,
	      state : state
	    },
	    nstate : CLOUDRONE.STATES['Selected']
	  },
	  CLOUDRONE.templates.drone_user_free
	  );
	}
	
	$('#elapsedTime').html('00:00:00');
      }
    }
    
    this.cpage = npage;
  },
  
 setPages : function() {
      
    (function() {
      var header = ['Main', 'Main', 'Main', 'SelectDrone', 'FlightTask', 'Monitoring', 'Result'];
      var content = ['Main', 'About', 'Register', 'SelectDrone', 'FlightTask', 'Monitoring', 'Result'];

      for (var i in header) {
	PAGE.pages[content[i]] = {
	  'header' : $('#header' + header[i]),
	  'content' : $('#content' + content[i])
	}
      }
    }());
    
    function setVisibility(params) {
      
      $(params.domElement).on('click', function(event) {
	PAGE.showPage(params.page);
      
	var domHide = params.domHide;
	for (var i = 0; i < ((domHide) ? domHide.length : 0); i ++) {
	  $(domHide[i]).hide();
	}
	
	var domShow = params.domShow;
	for (var i = 0; i < ((domShow) ? domShow.length : 0); i ++) {
	  $(domShow[i]).show();
	}
	
	CLOUDRONE.map.invalidateSize(false);
      
	var flags = params.flags;
	
	if (flags) {
	  if (flags.showDrones) {
	    WORKER_COMM.doShowDrones({
	      policy : CLOUDRONE.SHOWPOLICY.SHOW_ALL
	    },
	    CLOUDRONE.templates.drone_show);
	  }
      
	  if (flags.showResults) {
	    WORKER_COMM.initResults();
	  }
	}
      });
    };
    
    var objects = [
      {
	domelement : '#lMain',
	page : 'Main',
	},
      {
	domElement : '#lAbout',
	page : 'About',
      },
      {
	domElement : '#lRegister',
	page : 'Register',
      },
      {
	domElement : '#lSelectDroneMain',
	page : 'SelectDrone',
	flags : {
	  showDrones : true
	}
      },
      {
	domElement : '#lSelectDroneFlightTask',
	page : 'SelectDrone',
	flags : {
	  showDrones : true
	}
      },
      {
	domElement : '#lFlightTask',
	page : 'FlightTask',
      },
      {
	domElement : '#lMonitoringFlightTask',
	page : 'Monitoring',
      },
      {
	domElement : '#lResultFlightTask',
	page : 'Result',
	flags : {
	  showResults : true
	}
      },
      {
	domElement : '#lSelectDroneMonitoring',
	page : 'SelectDrone',
	flags : {
	  showDrones : true
	}
      },
      {
	domElement : '#lFlightTaskMonitoring',
	page : 'FlightTask',
      },
      {
	domElement : '#lMonitoring',
	page : 'Monitoring',
      },
      {
	domElement : '#lResultMonitoring',
	page : 'Result',
	flags : {
	  showResults : true
	}
      },
      {
	domElement : '#lSelectDroneResult',
	page : 'SelectDrone',
	flags : {
	  showDrones : true
	}
      },
      {
	domElement : '#lFlightTaskResult',
	page : 'FlightTask',
      },
      {
	domElement : '#lMonitoringResult',
	page : 'Monitoring',
      },
      {
	domElement : '#lResult',
	page : 'Result',
	flags : {
	  showResults : true
	}
      }
    ];
    
    for (var i = 0; i < objects.length; i++) {
      setVisibility(objects[i]);
    }
     
    (function() {
      $('input:radio[name="showDrones"]').change(function() {
	if ($(this).val() == 'showDronesAll') {
	  WORKER_COMM.doShowDrones({
	    policy : CLOUDRONE.SHOWPOLICY.SHOW_ALL
	  },
	  CLOUDRONE.templates.drone_show);
	}
	else if ($(this).val() == 'showDronesUser') {
	  WORKER_COMM.doShowDrones({
	    policy : CLOUDRONE.SHOWPOLICY.SHOW_USER,
	    user : localStorage.id
	  },
	  CLOUDRONE.templates.drone_show);
	}
	else if ($(this).val() == 'showDronesFree') {
	  WORKER_COMM.doShowDrones({
	    policy : CLOUDRONE.SHOWPOLICY.SHOW_FREE,
	  },
	  CLOUDRONE.templates.drone_show);
	}
      });
    }());
    
    $('#lSignOnMain').on('click', function() {
      $('#sign').each(function() {
	this.reset();
      });
      
      $('#sign').show();
      $('#signState').html('');
    });
    
    $('#lRegister').on('click', function() {
      $('#register').each(function() {
	this.reset();
      });
      
      $('#register').show();
      $('#registerState').html('');
    });

    var where = ['Main', 'FlightTask', 'Monitoring', 'Result'];

    for(var i in where) {
        $('#lSignOff' + where[i]).on('click', function() {
          if (localStorage.id !== '') {
	    WORKER_COMM.doSign({
		  user : {
		      id : localStorage.id
		  },
		  isPageUpdate : false
	      }, CLOUDRONE.templates.sign);
	  }
	  $('#signState').html('Выход выполнен успешно');
	  PAGE.showPage('Main');
	  $('#lSignOffMain').hide();
	  $('#lSelectDroneMain').hide();
	  $('#lUserNameMain').hide();
	  $('#lRegister').show();
	  $('#lSignOnMain').show();
        });
    }

    this.showPage('Main');
  },
  
  fetchRadioSelectDrones : function() {
    $('input:radio[name="showDrones"]').change(function() {
      if ($(this).val() == 'showDronesAll') {
	WORKER_COMM.doShowDrones({
	  policy : CLOUDRONE.SHOWPOLICY.SHOW_ALL
	},
	CLOUDRONE.templates.drone_show);
      }
      else if ($(this).val() == 'showDronesUser') {
	WORKER_COMM.doShowDrones({
	  policy : CLOUDRONE.SHOWPOLICY.SHOW_USER,
	  user : localStorage.id
	},
	CLOUDRONE.templates.drone_show);
      }
      else if ($(this).val() == 'showDronesFree') {
	WORKER_COMM.doShowDrones({
	  policy : CLOUDRONE.SHOWPOLICY.SHOW_FREE,
	},
	CLOUDRONE.templates.drone_show);
      }
    })
  },
};

