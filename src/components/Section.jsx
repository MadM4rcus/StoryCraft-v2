// src/components/Section.jsx

import React from 'react';

const Section = ({ title, isCollapsed, toggleSection, children }) => {
  return (
    <section className="mb-8 p-6 bg-bgSurface backdrop-blur-sm rounded-xl shadow-inner border border-bgElement">
      <h2 
        className="text-2xl font-bold text-textAccent mb-4 border-b-2 border-borderAccent pb-2 cursor-pointer flex justify-between items-center"
        onClick={toggleSection}
      >
        {title}
        <span>{isCollapsed ? '▼' : '▲'}</span>
      </h2>
      
      {!isCollapsed && (
        <>
            {children}
        </>
      )}
    </section>
  );
};

export default Section;