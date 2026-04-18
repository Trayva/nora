import React from "react";

/**
 * Skeleton Primitive Component
 * @param {Object} props
 * @param {'text' | 'circle' | 'rect'} props.variant - The shape of the skeleton
 * @param {string | number} props.width - Width of the skeleton
 * @param {string | number} props.height - Height of the skeleton
 * @param {string} props.className - Extra CSS classes
 * @param {Object} props.style - Inline styles
 */
const Skeleton = ({ 
  variant = "text", 
  width, 
  height, 
  className = "", 
  style = {} 
}) => {
  const baseClass = "skeleton_shimmer";
  const variantClass = `skeleton_${variant}`;
  
  const customStyle = {
    ...style,
    width: width || (variant === "circle" ? "40px" : "100%"),
    height: height || (variant === "circle" ? "40px" : undefined),
  };

  return (
    <div 
      className={`${baseClass} ${variantClass} ${className}`} 
      style={customStyle}
    />
  );
};

export default Skeleton;
