import React from 'react';

export interface ProjectCategoryBadgeProps {
  categoryName?: string;
}

/**
 * Componente para mostrar la etiqueta (badge) de categoría de proyecto con colores UNLa.
 */
export const ProjectCategoryBadge: React.FC<ProjectCategoryBadgeProps> = ({
  categoryName,
}) => {
  if (!categoryName) return null;

  const categoryLower = categoryName.toLowerCase().trim();
  let badgeClass = 'badge-generic';

  if (categoryLower.includes('desarrollo') || categoryLower === 'development') {
    badgeClass = 'badge-desarrollo';
  } else if (
    categoryLower.includes('investiga') ||
    categoryLower === 'research'
  ) {
    badgeClass = 'badge-investigacion';
  } else if (
    categoryLower.includes('extensi') ||
    categoryLower === 'extension'
  ) {
    badgeClass = 'badge-extension';
  } else if (categoryLower.includes('ppp')) {
    badgeClass = 'badge-ppp';
  } else if (categoryLower.includes('tfi')) {
    badgeClass = 'badge-tfi';
  }

  return (
    <span className={`project-category-badge ${badgeClass}`}>
      {categoryName}
    </span>
  );
};

export default ProjectCategoryBadge;
