var PAGE = { 
  pages : {},
  cpage : '',
  
  showPage : function(npage) {
    if (npage) {
      
      if (!!PAGE.cpage) {
	PAGE.pages[this.cpage].header.hide();
	PAGE.pages[this.cpage].content.hide();
      }
      
      PAGE.pages[npage].header.show();
      PAGE.pages[npage].content.show();
      
      if ($.inArray(npage, PAGE.dronePages) != -1) {
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
	  CLOUDRONE.clearTheClocks('#elapsedTime');
	}
      }
      
      this.cpage = npage;
      
    }
  },
  
  callDomMethods : function(domElements) {
    for (var id = 0; id < ((domElements) ? domElements.length : 0) ; id ++) {
      
      var domElem = domElements[id].element;
      var method = domElements[id].method;
      
      if (method === 'reset') {
	$(domElem)[0].reset();
      }
      else {
	var params = domElements[id].params;
	$(domElem)[method](params);
      }
    }
  },
  
  setPages : function() {
    function fetchPages() {
      var page = PAGE.maintenancePages.concat(PAGE.dronePages);

      for (var i in page) {
	this.pages[page[i]] = {
	  'header' : $('#header' + ($.inArray(page[i], PAGE.maintenancePages != -1) ? PAGE.mainPage : page[i])),
	  'content' : $('#content' + page[i])
	}
      }
    };
    
    function fetchDoms(params) {
      var method = params.method || 'click';
      
      $(params.domToFetch).on(method, function(event) {
	PAGE.showPage(params.page);
	
	PAGE.callDomMethods(params.domElements)
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
	  if (flags.signOff) {
	    if (localStorage.id !== '') {
	      WORKER_COMM.doSign({
		  user : {
		      id : localStorage.id
		  },
		  isPageUpdate : false
	      }, CLOUDRONE.templates.sign_off);
	    }
	  }
	}
      });
    };
    
    function fetchRadioSelectDrones() {
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
    };
    
    fetchPages.call(this);
    
    var domsToFetch = this.domsToFetch;
    
    for (var id = 0; id < domsToFetch.length; id++) {
      fetchDoms(domsToFetch[id]);
    }
    
    fetchRadioSelectDrones.call(this);
    
    this.showPage('Main');
  }
};