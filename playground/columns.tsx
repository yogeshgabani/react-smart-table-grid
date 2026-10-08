import type { ColumnDef } from 'react-smart-table-grid';
import type { Order, User } from './data';

/** Shared column sets used across the playground pages. */

export const userColumns: ColumnDef<User>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    type: 'avatar',
    cellOptions: { srcKey: 'avatar', nameKey: 'name' },
    width: 230,
    pinned: 'left',
    truncate: true,
  },
  { accessorKey: 'email', header: 'Email', type: 'email', width: 240, truncate: true },
  { accessorKey: 'role', header: 'Role', width: 160 },
  { accessorKey: 'department', header: 'Department', width: 150, filterType: 'select', groupable: true },
  { accessorKey: 'status', header: 'Status', type: 'status', width: 130, filterType: 'select' },
  {
    accessorKey: 'salary',
    header: 'Salary',
    type: 'currency',
    align: 'right',
    width: 130,
    aggregate: 'sum',
    cellOptions: { decimals: 0, notation: 'compact' },
  },
  { accessorKey: 'performance', header: 'Performance', type: 'progress', width: 170, aggregate: 'avg' },
  { accessorKey: 'rating', header: 'Rating', type: 'rating', width: 120 },
  { accessorKey: 'verified', header: 'Verified', type: 'boolean', align: 'center', width: 100 },
  { accessorKey: 'tags', header: 'Tags', type: 'tags', width: 190 },
  { accessorKey: 'profile.city', header: 'City', width: 130 },
  { accessorKey: 'country', header: 'Country', width: 160, filterType: 'select' },
  { accessorKey: 'joinedAt', header: 'Joined', type: 'date', width: 130 },
  { accessorKey: 'lastActive', header: 'Last active', type: 'relativeTime', width: 150 },
];

/** A compact set for pages that don't need every column. */
export const compactUserColumns: ColumnDef<User>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    type: 'avatar',
    cellOptions: { srcKey: 'avatar', nameKey: 'name' },
    width: 220,
    truncate: true,
  },
  { accessorKey: 'email', header: 'Email', type: 'email', width: 230, truncate: true },
  { accessorKey: 'department', header: 'Department', width: 150 },
  { accessorKey: 'status', header: 'Status', type: 'status', width: 120 },
  { accessorKey: 'salary', header: 'Salary', type: 'currency', align: 'right', width: 130, aggregate: 'sum' },
  { accessorKey: 'joinedAt', header: 'Joined', type: 'date', width: 130 },
];

/** Multi-level header groups. */
export const groupedUserColumns: ColumnDef<User>[] = [
  {
    id: 'identity',
    header: 'Identity',
    columns: [
      {
        accessorKey: 'name',
        header: 'Name',
        type: 'avatar',
        cellOptions: { srcKey: 'avatar', nameKey: 'name' },
        width: 220,
      },
      { accessorKey: 'email', header: 'Email', type: 'email', width: 230, truncate: true },
    ],
  },
  {
    id: 'employment',
    header: 'Employment',
    columns: [
      { accessorKey: 'role', header: 'Role', width: 150 },
      { accessorKey: 'department', header: 'Department', width: 150 },
      { accessorKey: 'status', header: 'Status', type: 'status', width: 120 },
    ],
  },
  {
    id: 'compensation',
    header: 'Compensation',
    columns: [
      { accessorKey: 'salary', header: 'Salary', type: 'currency', align: 'right', width: 130, aggregate: 'sum' },
      { accessorKey: 'performance', header: 'Performance', type: 'progress', width: 160, aggregate: 'avg' },
    ],
  },
];

export const editableUserColumns: ColumnDef<User>[] = [
  { accessorKey: 'name', header: 'Name', width: 200, editable: true },
  { accessorKey: 'email', header: 'Email', width: 240, editable: true, type: 'email' },
  {
    accessorKey: 'role',
    header: 'Role',
    width: 180,
    editable: true,
    editor: 'select',
    editorOptions: [
      { label: 'Engineer', value: 'Engineer' },
      { label: 'Senior Engineer', value: 'Senior Engineer' },
      { label: 'Lead', value: 'Lead' },
      { label: 'Manager', value: 'Manager' },
      { label: 'Director', value: 'Director' },
    ],
  },
  {
    accessorKey: 'salary',
    header: 'Salary',
    type: 'currency',
    align: 'right',
    width: 150,
    editable: true,
    editor: 'number',
    validate: (value) => {
      const n = Number(value);
      if (!Number.isFinite(n)) return 'Must be a number';
      if (n < 30000) return 'Minimum is 30,000';
      if (n > 500000) return 'Maximum is 500,000';
      return null;
    },
  },
  { accessorKey: 'verified', header: 'Verified', type: 'boolean', align: 'center', width: 110, editable: true, editor: 'checkbox' },
  { accessorKey: 'joinedAt', header: 'Joined', type: 'date', width: 150, editable: true, editor: 'date' },
];

export const orderColumns: ColumnDef<Order>[] = [
  { accessorKey: 'orderNo', header: 'Order', width: 130, pinned: 'left' },
  { accessorKey: 'customer', header: 'Customer', width: 190, truncate: true },
  { accessorKey: 'company', header: 'Company', width: 150, filterType: 'select', groupable: true },
  { accessorKey: 'channel', header: 'Channel', width: 120, filterType: 'select' },
  { accessorKey: 'items', header: 'Items', type: 'number', align: 'right', width: 90, aggregate: 'sum' },
  {
    accessorKey: 'total',
    header: 'Total',
    type: 'currency',
    align: 'right',
    width: 130,
    aggregate: 'sum',
  },
  { accessorKey: 'progress', header: 'Fulfilment', type: 'progress', width: 160 },
  { accessorKey: 'status', header: 'Status', type: 'status', width: 130, filterType: 'select' },
  { accessorKey: 'placedAt', header: 'Placed', type: 'date', width: 130 },
];

export const analyticsColumns: ColumnDef<User>[] = [
  { accessorKey: 'name', header: 'Account', width: 200, truncate: true },
  { accessorKey: 'country', header: 'Region', width: 150 },
  {
    accessorKey: 'revenue',
    header: 'Revenue',
    type: 'currency',
    align: 'right',
    width: 140,
    aggregate: 'sum',
    cellOptions: { notation: 'compact', decimals: 1 },
  },
  { accessorKey: 'growth', header: 'Growth', type: 'trend', align: 'right', width: 120, aggregate: 'avg' },
  { accessorKey: 'performance', header: 'Health', type: 'progress', width: 180, aggregate: 'avg' },
  { accessorKey: 'rating', header: 'Score', type: 'rating', width: 120 },
  { accessorKey: 'lastActive', header: 'Last seen', type: 'relativeTime', width: 150 },
];
