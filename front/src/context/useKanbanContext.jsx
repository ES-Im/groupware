import user1 from '@/assets/images/users/user-1.jpg';
import user2 from '@/assets/images/users/user-2.jpg';
import user3 from '@/assets/images/users/user-3.jpg';
import {yupResolver} from '@hookform/resolvers/yup';
import {createContext, startTransition, use, useCallback, useMemo, useState} from 'react';
import {useForm} from 'react-hook-form';
import * as yup from 'yup';

const defaultUsers = [user1, user2, user3];
const KanbanContext = createContext(undefined);
export const kanbanTaskSchema = yup.object({
  title: yup.string().required('Please enter project title'),
  userName: yup.string().required('Please enter username'),
  date: yup.string().required('Please enter project Date'),
  amount: yup.number().required('Please enter amount'),
  companyName: yup.mixed().required('Please Enter Company Name')
});
export const kanbanSectionSchema = yup.object({
  sectionTitle: yup.string().required('Section title is required'),
  sectionVariant: yup.mixed().required('Section variant is required')
});
const useKanbanContext = () => {
  const context = use(KanbanContext);
  if (!context) {
    throw new Error('useKanbanContext can only be used within KanbanProvider');
  }
  return context;
};
const KanbanProvider = ({
  children,
  tasksData,
  sectionsData
}) => {
  const [sections, setSections] = useState(sectionsData);
  const [tasks, setTasks] = useState(tasksData);
  const [activeSectionId, setActiveSectionId] = useState();
  const [activeTaskId, setActiveTaskId] = useState();
  const [taskFormData, setTaskFormData] = useState();
  const [sectionFormData, setSectionFormData] = useState();
  const [dialogStates, setDialogStates] = useState({
    showNewTaskModal: false,
    showSectionModal: false
  });
  const {
    control: newTaskControl,
    handleSubmit: newTaskHandleSubmit,
    reset: newTaskReset
  } = useForm({
    resolver: yupResolver(kanbanTaskSchema)
  });
  const {
    control: sectionControl,
    handleSubmit: sectionHandleSubmit,
    reset: sectionReset
  } = useForm({
    resolver: yupResolver(kanbanSectionSchema)
  });
  const emptySectionForm = useCallback(() => {
    sectionReset({
      sectionTitle: '',
      sectionVariant: 'primary'
    });
  }, []);
  const emptyTaskForm = useCallback(() => {
    newTaskReset({
      title: undefined,
      companyName: undefined,
      amount: undefined,
      date: undefined
    });
  }, []);
  const toggleNewTaskModal = (sectionId, taskId) => {
    if (sectionId) setActiveSectionId(sectionId);
    if (taskId) {
      const foundTask = tasks.find(task => task.id === taskId);
      if (foundTask) {
        newTaskReset({
          title: foundTask.title,
          amount: foundTask.amount,
          companyName: foundTask.company,
          date: foundTask.date
        });
        startTransition(() => {
          setActiveTaskId(taskId);
        });
        startTransition(() => {
          setTaskFormData(foundTask);
        });
      }
    }
    if (dialogStates.showNewTaskModal) emptyTaskForm();
    startTransition(() => {
      setDialogStates({
        ...dialogStates,
        showNewTaskModal: !dialogStates.showNewTaskModal
      });
    });
  };
  const toggleSectionModal = sectionId => {
    console.log(sectionFormData);
    if (sectionId) {
      const foundSection = sections.find(section => section.id === sectionId);
      if (foundSection) {
        startTransition(() => {
          setSectionFormData(foundSection);
        });
        startTransition(() => {
          setActiveSectionId(foundSection.id);
        });
        sectionReset({
          sectionTitle: foundSection.title,
          sectionVariant: foundSection.variant
        });
      }
    }
    if (dialogStates.showSectionModal) emptySectionForm();
    startTransition(() => {
      setDialogStates({
        ...dialogStates,
        showSectionModal: !dialogStates.showSectionModal
      });
    });
  };
  const getAllTasksPerSection = useCallback(id => {
    return tasks.filter(task => task.sectionId == id);
  }, [tasks]);
  const handleNewTask = newTaskHandleSubmit(values => {
    const formData = {
      title: values.title,
      companyName: values.companyName,
      amount: values.amount,
      userName: values.userName,
      date: values.date
    };
    if (activeSectionId) {
      const newTask = {
        ...formData,
        title: formData.title,
        company: formData.companyName,
        amount: formData.amount,
        date: formData.date,
        tasks: taskFormData?.tasks || 5,
        messages: taskFormData?.messages || 2,
        userName: formData.userName,
        user: taskFormData?.user || defaultUsers[0],
        status: taskFormData?.status || 'lead',
        sectionId: activeSectionId,
        id: Number(tasks.slice(-1)[0].id) + 1 + ''
      };
      setTasks([...tasks, newTask]);
    }
    startTransition(() => {
      toggleNewTaskModal();
    });
    setActiveSectionId(undefined);
    newTaskReset();
  });
  const handleEditTask = newTaskHandleSubmit(values => {
    const formData = {
      title: values.title,
      userName: values.userName,
      amount: values.amount,
      companyName: values.companyName,
      date: values.date
    };
    if (activeSectionId && activeTaskId) {
      const newTask = {
        ...formData,
        title: formData.title,
        userName: formData.userName,
        company: formData.companyName,
        amount: formData.amount,
        tasks: taskFormData?.tasks || 5,
        messages: taskFormData?.messages || 2,
        date: formData.date,
        user: taskFormData?.user || defaultUsers[0],
        sectionId: activeSectionId,
        status: taskFormData?.status || 'lead',
        id: activeTaskId
      };
      setTasks(tasks.map(t => t.id === activeTaskId ? newTask : t));
    }
    startTransition(() => {
      toggleNewTaskModal();
    });
    startTransition(() => {
      setActiveSectionId(undefined);
    });
    startTransition(() => {
      newTaskReset();
    });
    startTransition(() => {
      setTaskFormData(undefined);
    });
  });
  const handleDeleteTask = taskId => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };
  const onDragEnd = result => {
    const {
      destination,
      draggableId
    } = result;
    if (!destination) return;
    const taskIndex = tasks.findIndex(task => String(task.id) === String(draggableId));
    if (taskIndex === -1) return;
    const task = tasks[taskIndex];
    let newTasks = tasks.filter(t => String(t.id) !== String(draggableId));
    const updatedTask = {
      ...task,
      sectionId: destination.droppableId
    };
    let destIdx = 0;
    let count = 0;
    for (let i = 0; i < newTasks.length; i++) {
      if (newTasks[i].sectionId === destination.droppableId) {
        if (count === destination.index) {
          destIdx = i;
          break;
        }
        count++;
      }
      if (i === newTasks.length - 1) {
        destIdx = newTasks.length;
      }
    }
    newTasks = [...newTasks.slice(0, destIdx), updatedTask, ...newTasks.slice(destIdx)];
    setTasks(newTasks);
  };
  const handleNewSection = sectionHandleSubmit(values => {
    const section = {
      // TODO test, test when array is empty
      id: Number(sections.slice(-1)[0].id) + 1 + '',
      title: values.sectionTitle,
      variant: values.sectionVariant
    };
    setSections([...sections, section]);
    startTransition(() => {
      toggleSectionModal();
    });
    sectionReset();
  });
  const handleEditSection = sectionHandleSubmit(values => {
    if (activeSectionId) {
      const newSection = {
        id: activeSectionId,
        title: values.sectionTitle,
        variant: values.sectionVariant
      };
      setSections(sections.map(section => {
        return section.id === activeSectionId ? newSection : section;
      }));
    }
    startTransition(() => {
      toggleSectionModal();
    });
    sectionReset();
  });
  const handleDeleteSection = sectionId => {
    setSections(sections.filter(section => section.id !== sectionId));
  };
  return <KanbanContext.Provider value={useMemo(() => ({
    sections,
    activeSectionId,
    taskFormData,
    sectionFormData,
    newTaskModal: {
      open: dialogStates.showNewTaskModal,
      toggle: toggleNewTaskModal
    },
    sectionModal: {
      open: dialogStates.showSectionModal,
      toggle: toggleSectionModal
    },
    taskForm: {
      control: newTaskControl,
      newRecord: handleNewTask,
      editRecord: handleEditTask,
      deleteRecord: handleDeleteTask
    },
    sectionForm: {
      control: sectionControl,
      newRecord: handleNewSection,
      editRecord: handleEditSection,
      deleteRecord: handleDeleteSection
    },
    getAllTasksPerSection,
    onDragEnd
  }), [sections, tasks, activeSectionId, taskFormData, sectionFormData, dialogStates])}>
      {children}
    </KanbanContext.Provider>;
};
export { KanbanProvider, useKanbanContext };