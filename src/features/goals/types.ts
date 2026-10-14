export interface Goal {
  id: string;
  title: string;
  note?: string;
  completed: boolean;
  createdAt: string;
}

export interface GoalMilestone {
  id: string;
  goalId: string;
  title: string;
  position: number;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
}

export interface GoalWithMilestones extends Goal {
  milestones: GoalMilestone[];
}
