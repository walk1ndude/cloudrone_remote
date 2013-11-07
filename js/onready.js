$(document).ready(function() {
 
  Number.prototype.mod = function(n) { return ((this%n)+n)%n; }
  
  PAGE.setPages();
    
  WORKER_COMM.initRos({
    roshostname : '46.47.1.24',
    rosport : 12000,
    mjpeghostname : '46.47.1.24',
    mjpegport : 12001
  });
  
  if (localStorage.id !== '') {
    $('#lSignOff').show();
  }
  else {
    $('#lSignOff').hide();
  }
  
  WORKER_COMM.doSign({
      user : {
	id : localStorage.id
      },
      isPageUpdate : true
  }, CLOUDRONE.templates.sign);

  CLOUDRONE.map = L.map('taskMap').setView([0, 0], 0);
  
  $('window').bind('unload', function(eventObject) {
      alert('here');
      return true;
    });

  $('#bFlightTaskInput').change(function(eventObject) {
    CLOUDRONE.loadFlightTask(eventObject);
  });
})
