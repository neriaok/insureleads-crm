import type { ChangeEvent, FC } from 'react';
import { useAssignLeadMutation } from '../../features/leads/leadsApi';
import { useListUsersQuery } from '../../features/users/usersApi';
import styles from './AssignSelect.module.css';

interface AssignSelectProps {
  leadId: number;
  agentId: number | null;
}

// Admin-only control for assigning a lead to an agent.
const AssignSelect: FC<AssignSelectProps> = ({ leadId, agentId }) => {
  const { data: users = [] } = useListUsersQuery();
  const [assignLead, { isLoading }] = useAssignLeadMutation();
  const agents = users.filter((user) => user.role === 'agent');

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    void assignLead({ id: leadId, agentId: value === '' ? null : Number(value) });
  };

  return (
    <select
      className={styles.select}
      value={agentId ?? ''}
      onChange={handleChange}
      disabled={isLoading}
      onClick={(e) => e.stopPropagation()}
      aria-label="שיוך לסוכן"
    >
      <option value="">לא משויך</option>
      {agents.map((agent) => (
        <option key={agent.id} value={agent.id}>
          {agent.name}
        </option>
      ))}
    </select>
  );
};

export default AssignSelect;
