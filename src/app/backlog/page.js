// src/app/page.js
import React from 'react';
import fs from 'fs';
import path from 'path';
import TaskCard from './components/TaskCard';
import {getCurrentFormattedDate} from '../../components/date' 
import BacklogList from './components/BacklogList.js';

const Backlog = async () => {
  const filePath = path.join(process.cwd(), 'src/utils/jsons/todos.json');
  const jsonData = fs.readFileSync(filePath, 'utf8');
  const tasks = JSON.parse(jsonData);
  //filter out completed tasks
  const incompleteTasks = tasks.filter(task => task["Complete Date"] === null);
  //set rank order of text values and reorder tasks
  const priorityOrder = ["P0", "P1", "P2", "P3"];
  incompleteTasks.sort((a, b) => {
    const priorityA = a["Priority"];
    const priorityB = b["Priority"];
    return priorityOrder.indexOf(priorityA) - priorityOrder.indexOf(priorityB);
  });
  //get current date from date component
  const today = getCurrentFormattedDate();

  return (

    <main className="flex min-h-screen flex-col items-center p-4 md:px-24 md:pt-12 w-full h-full">

    <h1 className="hover:scale-150 text-5xl font-semibold text-slate-800 mt-2 mb-10 bg-clip-text text-transparent bg-gradient-radial  from-purple-500 via-cyan-500 to-pink-600 drop-shadow-md">Task Backlog</h1>
    <p className='text-white mb-10'>{today}</p>

    <div className="flex flex-col w-full h-full mb-10">
      <h1 className="text-xl md:text-3xl font-semibold mb-3 bg-clip-text text-transparent bg-gradient-to-br from-cyan-500 via-neutral-400 to-cyan-700">Section</h1>
      <div className="bg-gradient-to-r from-purple-900 to-purple-300 h-[2px] mb-3"></div>
      <BacklogList/>
      <div className='flex flex-col md:flex-row'>
        <div className='h-auto w-full'>Analytics Placeholder</div>
        <div className="flex flex-col w-full max-w-[750px] m-auto">
          {incompleteTasks.map((task, index) => (
            <TaskCard key={index} task={task} />
          ))}
            
        </div>
      </div>

    </div>

    </main>

      
  );
};

export default Backlog;
