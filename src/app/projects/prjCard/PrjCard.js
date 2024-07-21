// src/app/components/TaskCard.js
import React from 'react';
import './PrjCard.css';

const PrjCard = ({ milestone }) => {
  return (
    <div className="flip-card">
      <div className="flip-card-inner">
        <div className="flip-card-front">
          <h2 className="font-bold text-xl mb-2 text-cyan-700">{milestone["Milestone"]}</h2>
          <div className='text-left border-t pt-3'>
            <p className='text-purple-900'><strong>Project:</strong> {milestone["Project"]}</p>
            <p><strong>Start Date:</strong> {milestone["Start Date"]}</p>
            <p><strong>Due Date:</strong> {milestone["Due Date"]}</p>
            <p><strong>Priority:</strong> {milestone["Priority"]}</p>
          </div>
        </div>
        <div className="flip-card-back">
          {Object.keys(milestone).map((key, index) => (
            (key !== "Task Name" && key !== "Start Date" && key !== "Due Date" && key !== "Priority" && key !== "Milestone" && key !== "Project") && (
              <p key={index}><strong>{key}:</strong> {milestone[key]}</p>
            )
          ))}
        </div>
      </div>
    </div>
  );
};

export default PrjCard;
