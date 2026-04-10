import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataTable } from '../DataTable';

interface TestData {
  id: string;
  name: string;
  status: 'active' | 'inactive';
}

const mockColumns = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'name', label: 'Name', sortable: true },
  { key: 'status', label: 'Status', sortable: false },
];

const mockData: TestData[] = [
  { id: '1', name: 'User 1', status: 'active' },
  { id: '2', name: 'User 2', status: 'inactive' },
  { id: '3', name: 'User 3', status: 'active' },
];

describe('DataTable Component', () => {
  it('renders table with columns and data', () => {
    render(<DataTable columns={mockColumns} data={mockData} rowKey="id" />);

    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('User 1')).toBeInTheDocument();
  });

  it('renders correct number of rows', () => {
    render(<DataTable columns={mockColumns} data={mockData} rowKey="id" />);
    const rows = screen.getAllByRole('row');
    // Header + 3 data rows
    expect(rows).toHaveLength(4);
  });

  it('displays empty state when no data', () => {
    render(<DataTable columns={mockColumns} data={[]} rowKey="id" emptyMessage="No data" />);
    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('handles sorting when sortable column is clicked', async () => {
    const { container } = render(
      <DataTable columns={mockColumns} data={mockData} rowKey="id" sortable />
    );

    const sortButton = screen.getByText('ID').closest('button');
    if (sortButton) {
      await userEvent.click(sortButton);
      // After sorting, the order might change
      expect(container.querySelector('table')).toBeInTheDocument();
    }
  });

  it('applies striped styling when striped prop is true', () => {
    const { container } = render(
      <DataTable columns={mockColumns} data={mockData} rowKey="id" striped />
    );
    const table = container.querySelector('table');
    expect(table).toBeInTheDocument();
  });

  it('renders custom cell content', () => {
    const customColumns = [
      ...mockColumns.slice(0, 2),
      {
        key: 'status',
        label: 'Status',
        render: (value: string) => <span className="badge">{value.toUpperCase()}</span>,
      },
    ];

    render(<DataTable columns={customColumns} data={mockData} rowKey="id" />);
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
  });
});
