'use strict';

const { PAGINATION } = require('../config/constants');

const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || PAGINATION.DEFAULT_PAGE);
  const pageSize = Math.min(
    PAGINATION.MAX_LIMIT,
    Math.max(1, parseInt(query.limit || query.pageSize) || PAGINATION.DEFAULT_LIMIT)
  );
  const offset = (page - 1) * pageSize;
  return { page, pageSize, offset };
};

const paginatedResponse = (data, total, page, pageSize) => {
  const totalPages = Math.ceil(total / pageSize);
  return {
    data,
    pagination: {
      total,
      page,
      pageSize,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

const buildOrderBy = (sort, allowedFields, defaultField = 'created_at', defaultDir = 'DESC') => {
  if (!sort) return `${defaultField} ${defaultDir}`;
  const [field, dir] = sort.split(':');
  const safeField = allowedFields.includes(field) ? field : defaultField;
  const safeDir = ['ASC', 'DESC'].includes((dir || '').toUpperCase()) ? dir.toUpperCase() : defaultDir;
  return `${safeField} ${safeDir}`;
};

module.exports = { parsePagination, paginatedResponse, buildOrderBy };
