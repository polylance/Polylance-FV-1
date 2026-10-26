import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ErrorState } from '../components/common/ErrorState';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-[#FFFFFF]">
      <ErrorState
        variant="404"
        title="Page Does Not Exist"
        description="The requested route could not be found or has moved. Explore available jobs or return to the dashboard."
        actionText="Explore Jobs"
        onAction={() => navigate('/jobs')}
        secondaryActionText="Go Back"
        onSecondaryAction={() => navigate(-1)}
      />
    </div>
  );
};

export default NotFound;
