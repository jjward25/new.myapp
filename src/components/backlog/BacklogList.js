'use client';

import TaskCard from './TaskCard';

const BacklogList = ({ backlog, loading, error }) => {
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="w-full">
      {backlog.map(item => (
        <TaskCard
          key={item._id}
          task={item}
          // Add handlers here if needed
        />
      ))}
    </div>
  );
};

export default BacklogList;
