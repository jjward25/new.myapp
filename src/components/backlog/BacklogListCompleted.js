'use client';

import TaskCard from './TaskCard';

const BacklogList = ({ backlog, loading, error }) => {
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  const filteredBacklog = backlog.filter(item =>
    item["Complete Date"] != null
  );

  return (
    <div className="w-full">
      {filteredBacklog.map(item => (
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
