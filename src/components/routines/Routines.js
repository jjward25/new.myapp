// src/app/page.js
import React from 'react';
import fs from 'fs';
import path from 'path';
import AddRoutineButton from './NewButton';
import RoutineCardList from './RoutineCardList';

const Routines = async () => {

  return (
    <div className='w-full'>
        <AddRoutineButton />
        <RoutineCardList />
    </div>
  );
};

export default Routines;
