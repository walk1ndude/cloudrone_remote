PAGE.domsToFetch = [
  {
    domToFetch : '#lMain',
    domElements : [
      {
	element : '#headerSelectDrone',
	method : 'hide'
      },
    ],
    page : 'Main',
    },
  {
    domToFetch : '#lAbout',
    domElements : [
      {
	element : '#headerSelectDrone',
	method : 'hide'
      },
    ],
    page : 'About',
  },
  {
    domToFetch : '#lRegister',
    domElements : [
      {
	element : '#headerSelectDrone',
	method : 'hide'
      },
    ],
    page : 'Register',
  },
  {
    domToFetch : '#lSelectDroneMain',
    domElements : [
      {
	element : '#headerSelectDrone',
	method : 'show'
      },
    ],
    page : 'SelectDrone',
    flags : {
      showDrones : true
    }
  },
  {
    domToFetch : '#lSelectDroneFlightTask',
    domElements : [
      {
	element : '#headerSelectDrone',
	method : 'show'
      },
    ],
    page : 'SelectDrone',
    flags : {
      showDrones : true
    }
  },
  {
    domToFetch : '#lFlightTask',
    domElements : [
      {
	element : '#headerSelectDrone',
	method : 'hide'
      },
    ],
    page : 'FlightTask',
  },
  {
    domToFetch : '#lMonitoringFlightTask',
    domElements : [
      {
	element : '#headerSelectDrone',
	method : 'hide'
      },
    ],
    page : 'Monitoring',
  },
  {
    domToFetch : '#lResultFlightTask',
    domElements : [
      {
	element : '#headerSelectDrone',
	method : 'hide'
      },
    ],
    page : 'Result',
    flags : {
      showResults : true
    }
  },
  {
    domElement : '#lSelectDroneMonitoring',
    domElements : [
      {
	element : '#headerSelectDrone',
	method : 'show'
      },
    ],
    page : 'SelectDrone',
    flags : {
      showDrones : true
    }
  },
  {
    domToFetch : '#lFlightTaskMonitoring',
    domElements : [
      {
	element : '#headerSelectDrone',
	method : 'hide'
      },
    ],
    page : 'FlightTask',
  },
  {
    domToFetch : '#lMonitoring',
    domElements : [
      {
	element : '#headerSelectDrone',
	method : 'hide'
      },
    ],
    page : 'Monitoring',
  },
  {
    domToFetch : '#lResultMonitoring',
    domElements : [
      {
	element : '#headerSelectDrone',
	method : 'hide'
      },
    ],
    page : 'Result',
    flags : {
      showResults : true
    }
  },
  {
    domToFetch : '#lSelectDroneResult',
    domElements : [
      {
	element : '#headerSelectDrone',
	method : 'show'
      },
    ],
    page : 'SelectDrone',
    flags : {
      showDrones : true
    }
  },
  {
    domToFetch : '#lFlightTaskResult',
    domElements : [
      {
	element : '#headerSelectDrone',
	method : 'hide'
      },
    ],
    page : 'FlightTask',
  },
  {
    domToFetch : '#lMonitoringResult',
    domElements : [
      {
	element : '#headerSelectDrone',
	method : 'hide'
      },
    ],
    page : 'Monitoring',
  },
  {
    domToFetch : '#lResult',
    domElements : [
      {
	element : '#headerSelectDrone',
	method : 'hide'
      },
    ],
    page : 'Result',
    flags : {
      showResults : true
    }
  },
  {
    domToFetch : '#lSignOnMain',
    domElements : [
    {
      element : '#sign',
      method : 'reset',
    },
    {
      element : '#sign',
      method : 'show',
    },
    {
      element : '#signState',
      method : 'html',
      params : '',
    }
    ]
  },
  {
    domToFetch : '#lRegister',
    domElements : [
    {
      element : '#register',
      method : 'reset',
    },
    {
      element : '#register',
      method : 'show',
    },
    {
      element : '#registerState',
      method : 'html',
      params : '',
    }
    ]
  },
  {
    domToFetch : '#lSignOffMain',
    flags : {
      signOff : true,
    },
  },
  {
    domToFetch : '#lSignOffFlightTask',
    flags : {
      signOff : true,
    },
  },
  {
    domToFetch : '#lSignOffMonitoring',
    flags : {
      signOff : true,
    },
  },
  {
    domToFetch : '#lSignOffResult',
    flags : {
      signOff : true,
    },
  }
];