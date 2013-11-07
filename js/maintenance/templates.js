CLOUDRONE.templates = {
  sign_on : {
    success : {
      id : 'sign_on_success',
      page : 'Main',
      domElements : [
	{
	  element : '#sign',
	  method : 'hide'
	},
	{
	  element : '#lSelectDroneMain',
	  method : 'show'
	},
	{
	  element : '#headerSelectDrone',
	  method : 'hide'
	},
	{
	  element : '#lRegister',
	  method : 'hide'
	},
	{
	  element : '#lSignOnMain',
	  method : 'hide'
	},
	{
	  element : '#signState',
	  method : 'html',
	  params : ['']
	},
	{
	  element : '#lSignOffMain',
	  method : 'show',
	},
      ]
    },
    failure : {
      id : 'sign_on_failure',
      domElements : [
	{
	  element : '#signState',
	  method : 'html',
	  params : ['Данный пользователь не зарегистрирован']
	},
	{
	  element : '#sign',
	  method : 'hide',
	},
	{
	  element : '#headerSelectDrone',
	  method : 'hide'
	},
      ]
    }
  },
  sign_off : {
    success : {
      id : 'sign_off_success',
      page : 'Main',
      domElements : [
	{
	  element : '#signState',
	  method : 'html',
	  params : ['Выход выполнен успешно'],
	},
	{
	  element : '#lSignOffMain',
	  method : 'hide'
	},
	{
	  element : '#headerSelectDrone',
	  method : 'hide'
	},
	{
	  element : '#lSelectDroneMain',
	  method : 'hide'
	},
	{
	  element : '#lUserNameMain',
	  method : 'hide'
	},
	{
	  element : '#lRegister',
	  method : 'show',
	},
	{
	  element : '#lSignOnMain',
	  method : 'show',
	}
      ]
    },
    failure : {
      id : 'sign_off_failure',
      domElements : [
	{
	  element : '#signState',
	  method : 'html',
	  params : ['Ошибка! Выход не выполнен.']
	},
	{
	  element : '#headerSelectDrone',
	  method : 'hide'
	},
      ]
    }
  },
  
  reg : {
    success : {
      id : 'reg_success',
      domElements : [
	{
	  element : '#lRegister',
	  method : 'hide'
	},
	{
	  element : '#lSelectDroneMain',
	  method : 'show'
	},
	{
	  element : '#headerSelectDrone',
	  method : 'hide'
	},
      ]
    },
    failure : {
      id : 'reg_failure',
      domElements : [
	{
	  element : '#registerState',
	  method : 'html',
	  params : ['Ошибка! Регистрация не выполнена']
	},
	{
	  element : '#headerSelectDrone',
	  method : 'hide'
	},
      ]
    }
  },
  
  drone_show : {
    success : {
      id : 'drone_show_success',
    },
    failure : {
      id : 'drone_show_failure',
      alerts : ['Ошибка! Невозможно вывести список БИТС'],
    }
  },
  
  drone_user_free : {
    success : {
      id : 'drone_user_free_success',
    },
    failure : {
      id : 'drone_user_free_failure',
    }
  },
  
  drone_pick : {
    success : {
      id : 'drone_pick_success',
      pages : 'FlightTask',
      domElements : [
	{
	  element : '#bFlightTaskInput',
	  method : 'removeAttr',
	  params : ['disabled'],
	},
	{
	  element : '#headerSelectDrone',
	  method : 'hide'
	},
      ],
    },
    failure : {
      id : 'drone_pick_failure',
      alerts : ['Невозможно изменить статус БИТС'],
      domElements : [
      {
	element : '#headerSelectDrone',
	method : 'hide'
      },
      ],
    }
  },
  
  task_start : {
    success : {
      id : 'task_start_success',
      domElements : [
      {
	element : '#headerSelectDrone',
	method : 'hide'
      },
      ],
    },
    failure : {
      id : 'task_start_failure',
      alerts : ['Невозможно начать выполнение полетного задания'],
      domElements : [
      {
	element : '#headerSelectDrone',
	method : 'hide'
      },
      ],
    }
  },
  
  task_stop : {
    success : {
      id : 'task_stop_success',
      domElements : [
      {
	element : '#headerSelectDrone',
	method : 'hide'
      },
      ],
    },
    failure : {
      id : 'task_stop_failure',
      alerts : ['Невозможно освободить БИТС'],
      domElements : [
      {
	element : '#headerSelectDrone',
	method : 'hide'
      },
      ],
    }
  },
  
  task_complete : {
    success : {
      id : 'task_complete_success',
      domElements : [
      {
	element : '#headerSelectDrone',
	method : 'hide'
      },
      ],
    },
    failure : {
      id : 'task_complete_failure',
      alerts : ['Невозможно завершить полетное задание'],
      domElements : [
      {
	element : '#headerSelectDrone',
	method : 'hide'
      },
      ],
    }
  }
};