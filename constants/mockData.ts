export interface Course {
  id: string;
  code: string;
  name: string;
  department: string;
  color: string;
  memberCount: number;
  activeRequests: number;
  recentMessage?: string;
  recentMessageTime?: string;
}

export interface StudyRequest {
  id: string;
  courseId: string;
  courseCode: string;
  authorName: string;
  authorInitials: string;
  helpNeeded: string;
  topic: string;
  availability: string;
  preference: 'text-only' | 'online' | 'in-person' | 'flexible';
  groupSize: number;
  interestedCount: number;
  createdAt: string;
  isPostedToHub: boolean;
}

export interface Message {
  id: string;
  authorName: string;
  authorInitials: string;
  text: string;
  timestamp: string;
  isStudyRequest?: boolean;
  studyRequestId?: string;
  isOwn?: boolean;
}

export interface PeerPod {
  id: string;
  name: string;
  courseCode: string;
  topic: string;
  members: PodMember[];
  lastMessage?: string;
  lastMessageTime?: string;
  tasksTotal: number;
  tasksDone: number;
  meetingProposal?: MeetingProposal;
}

export interface PodMember {
  id: string;
  name: string;
  initials: string;
  instagram?: string;
  discord?: string;
}

export interface MeetingProposal {
  proposedBy: string;
  type: 'online' | 'in-person';
  timeWindow: string;
  location?: string;
  acceptedCount: number;
  totalCount: number;
}

export interface SoloTask {
  id: string;
  text: string;
  courseCode?: string;
  completed: boolean;
  isStuck: boolean;
  createdAt: string;
}

export const CURRENT_USER = {
  id: 'u1',
  name: 'Alex Chen',
  initials: 'AC',
  email: 'achen@calpoly.edu',
  year: 'Junior',
  major: 'Computer Science',
  instagram: '@alexchen_',
  discord: 'alexchen#4521',
};

export const COURSES: Course[] = [
  {
    id: 'c1',
    code: 'CSC 202',
    name: 'Data Structures',
    department: 'Computer Science',
    color: '#2D5F3A',
    memberCount: 34,
    activeRequests: 3,
    recentMessage: 'Anyone know how to approach the BST balancing problem?',
    recentMessageTime: '2m ago',
  },
  {
    id: 'c2',
    code: 'CSC 357',
    name: 'Systems Programming',
    department: 'Computer Science',
    color: '#1E432A',
    memberCount: 28,
    activeRequests: 2,
    recentMessage: 'Lab 4 is due Friday - the pipe stuff is tricky',
    recentMessageTime: '15m ago',
  },
  {
    id: 'c3',
    code: 'MATH 244',
    name: 'Linear Analysis I',
    department: 'Mathematics',
    color: '#A88C2E',
    memberCount: 41,
    activeRequests: 4,
    recentMessage: 'Can someone explain eigenvalues again differently?',
    recentMessageTime: '1h ago',
  },
  {
    id: 'c4',
    code: 'PHIL 231',
    name: 'Ethics in Technology',
    department: 'Philosophy',
    color: '#587558',
    memberCount: 22,
    activeRequests: 1,
    recentMessage: 'Essay 2 prompt is posted - what angle is everyone taking?',
    recentMessageTime: '3h ago',
  },
  {
    id: 'c5',
    code: 'STAT 312',
    name: 'Statistical Methods',
    department: 'Statistics',
    color: '#66531B',
    memberCount: 30,
    activeRequests: 2,
    recentMessage: 'Hypothesis testing practice session anyone?',
    recentMessageTime: '5h ago',
  },
];

export const STUDY_REQUESTS: StudyRequest[] = [
  {
    id: 'sr1',
    courseId: 'c1',
    courseCode: 'CSC 202',
    authorName: 'Jordan Kim',
    authorInitials: 'JK',
    helpNeeded: 'I can implement a basic BST but I keep getting confused on rotations for AVL trees. Need someone to walk through it step by step.',
    topic: 'AVL Tree Rotations',
    availability: 'Today after 4pm or tomorrow morning',
    preference: 'online',
    groupSize: 3,
    interestedCount: 2,
    createdAt: '25m ago',
    isPostedToHub: true,
  },
  {
    id: 'sr2',
    courseId: 'c1',
    courseCode: 'CSC 202',
    authorName: 'Mia Nguyen',
    authorInitials: 'MN',
    helpNeeded: 'Struggling with time complexity analysis for recursive algorithms. The recurrence relations just don\'t click for me yet.',
    topic: 'Recursion & Time Complexity',
    availability: 'Flexible this week',
    preference: 'flexible',
    groupSize: 4,
    interestedCount: 5,
    createdAt: '2h ago',
    isPostedToHub: true,
  },
  {
    id: 'sr3',
    courseId: 'c2',
    courseCode: 'CSC 357',
    authorName: 'Tomas Rivera',
    authorInitials: 'TR',
    helpNeeded: 'The fork/exec/pipe lab is due Friday and I\'m stuck on connecting multiple processes. Would love to debug together.',
    topic: 'Unix Pipes & Processes',
    availability: 'Wed or Thu evening',
    preference: 'in-person',
    groupSize: 2,
    interestedCount: 1,
    createdAt: '45m ago',
    isPostedToHub: true,
  },
  {
    id: 'sr4',
    courseId: 'c3',
    courseCode: 'MATH 244',
    authorName: 'Priya Patel',
    authorInitials: 'PP',
    helpNeeded: 'I understand matrix multiplication but eigenvalue decomposition is a wall. Need a different explanation than the textbook.',
    topic: 'Eigenvalue Decomposition',
    availability: 'Any afternoon this week',
    preference: 'text-only',
    groupSize: 3,
    interestedCount: 4,
    createdAt: '1h ago',
    isPostedToHub: true,
  },
  {
    id: 'sr5',
    courseId: 'c1',
    courseCode: 'CSC 202',
    authorName: 'Alex Chen',
    authorInitials: 'AC',
    helpNeeded: 'Hash table collision resolution - I get chaining but open addressing schemes (linear probing, quadratic, double hashing) confuse me.',
    topic: 'Hash Table Collision Resolution',
    availability: 'Tomorrow afternoon',
    preference: 'online',
    groupSize: 3,
    interestedCount: 3,
    createdAt: '4h ago',
    isPostedToHub: true,
  },
  {
    id: 'sr6',
    courseId: 'c3',
    courseCode: 'MATH 244',
    authorName: 'Leo Martinez',
    authorInitials: 'LM',
    helpNeeded: 'Practice session for the midterm covering vector spaces and linear transformations.',
    topic: 'Midterm Review: Vector Spaces',
    availability: 'This weekend',
    preference: 'in-person',
    groupSize: 5,
    interestedCount: 7,
    createdAt: '6h ago',
    isPostedToHub: true,
  },
];

export const COURSE_MESSAGES: Record<string, Message[]> = {
  c1: [
    {
      id: 'm1',
      authorName: 'Jordan Kim',
      authorInitials: 'JK',
      text: 'Hey everyone, did anyone figure out the time complexity for problem 3 on the homework?',
      timestamp: '10:32 AM',
    },
    {
      id: 'm2',
      authorName: 'Mia Nguyen',
      authorInitials: 'MN',
      text: 'I think it\'s O(n log n) because of the divide step, but I\'m not 100% sure on the combine step.',
      timestamp: '10:35 AM',
    },
    {
      id: 'm3',
      authorName: 'Alex Chen',
      authorInitials: 'AC',
      text: 'Yeah the combine is O(n) so the overall recurrence is T(n) = 2T(n/2) + O(n) which gives O(n log n) by the master theorem.',
      timestamp: '10:38 AM',
      isOwn: true,
    },
    {
      id: 'm4',
      authorName: 'Jordan Kim',
      authorInitials: 'JK',
      text: 'Thanks! Also I posted a study request for AVL trees if anyone wants to work through rotations together.',
      timestamp: '10:42 AM',
      isStudyRequest: true,
      studyRequestId: 'sr1',
    },
    {
      id: 'm5',
      authorName: 'Sam Ortiz',
      authorInitials: 'SO',
      text: 'Anyone know how to approach the BST balancing problem?',
      timestamp: '11:15 AM',
    },
  ],
  c2: [
    {
      id: 'm6',
      authorName: 'Tomas Rivera',
      authorInitials: 'TR',
      text: 'Lab 4 is due Friday - the pipe stuff is tricky',
      timestamp: '9:20 AM',
    },
    {
      id: 'm7',
      authorName: 'Alex Chen',
      authorInitials: 'AC',
      text: 'The key insight is that you need to close unused pipe ends in both parent and child after dup2.',
      timestamp: '9:45 AM',
      isOwn: true,
    },
    {
      id: 'm8',
      authorName: 'Riley Zhang',
      authorInitials: 'RZ',
      text: 'Also make sure you\'re handling SIGCHLD properly or you\'ll get zombies.',
      timestamp: '10:02 AM',
    },
  ],
};

export const PEER_PODS: PeerPod[] = [
  {
    id: 'p1',
    name: 'AVL Tree Squad',
    courseCode: 'CSC 202',
    topic: 'AVL Tree Rotations',
    members: [
      { id: 'u1', name: 'Alex Chen', initials: 'AC', instagram: '@alexchen_', discord: 'alexchen#4521' },
      { id: 'u2', name: 'Jordan Kim', initials: 'JK', discord: 'jordank#8832' },
      { id: 'u3', name: 'Sam Ortiz', initials: 'SO', instagram: '@sam.o' },
    ],
    lastMessage: 'I drew out the rotation cases - sharing a screenshot',
    lastMessageTime: '20m ago',
    tasksTotal: 4,
    tasksDone: 2,
    meetingProposal: {
      proposedBy: 'Jordan Kim',
      type: 'online',
      timeWindow: 'Compatible window: Today 4-6pm',
      acceptedCount: 2,
      totalCount: 3,
    },
  },
  {
    id: 'p2',
    name: 'Eigenvalue Crew',
    courseCode: 'MATH 244',
    topic: 'Eigenvalue Decomposition',
    members: [
      { id: 'u1', name: 'Alex Chen', initials: 'AC', instagram: '@alexchen_', discord: 'alexchen#4521' },
      { id: 'u4', name: 'Priya Patel', initials: 'PP', instagram: '@priya.p' },
      { id: 'u5', name: 'Leo Martinez', initials: 'LM' },
    ],
    lastMessage: 'Check out this video I found - it explains it way better than the book',
    lastMessageTime: '1h ago',
    tasksTotal: 6,
    tasksDone: 3,
  },
  {
    id: 'p3',
    name: 'Pipe Masters',
    courseCode: 'CSC 357',
    topic: 'Unix Pipes & Processes',
    members: [
      { id: 'u1', name: 'Alex Chen', initials: 'AC', instagram: '@alexchen_', discord: 'alexchen#4521' },
      { id: 'u6', name: 'Tomas Rivera', initials: 'TR', discord: 'tomas_r#2211' },
    ],
    lastMessage: 'I got the bidirectional pipe working - let me share my approach',
    lastMessageTime: '3h ago',
    tasksTotal: 3,
    tasksDone: 1,
  },
];

export const POD_MESSAGES: Record<string, Message[]> = {
  p1: [
    {
      id: 'pm1',
      authorName: 'Jordan Kim',
      authorInitials: 'JK',
      text: 'Hey team! So for AVL rotations, I think the key is understanding when each case triggers.',
      timestamp: '2:10 PM',
    },
    {
      id: 'pm2',
      authorName: 'Sam Ortiz',
      authorInitials: 'SO',
      text: 'Right - left-left case = right rotation, right-right case = left rotation. But the double rotations trip me up.',
      timestamp: '2:15 PM',
    },
    {
      id: 'pm3',
      authorName: 'Alex Chen',
      authorInitials: 'AC',
      text: 'The trick is: left-right means do a left rotation on the left child first, THEN a right rotation on the root. Think of it as straightening the zig-zag first.',
      timestamp: '2:22 PM',
      isOwn: true,
    },
    {
      id: 'pm4',
      authorName: 'Jordan Kim',
      authorInitials: 'JK',
      text: 'I drew out the rotation cases - sharing a screenshot',
      timestamp: '2:30 PM',
    },
  ],
};

export const POD_TASKS: Record<string, { id: string; text: string; completed: boolean; assignee?: string }[]> = {
  p1: [
    { id: 'pt1', text: 'Review single rotation cases (LL and RR)', completed: true, assignee: 'Jordan' },
    { id: 'pt2', text: 'Review double rotation cases (LR and RL)', completed: true, assignee: 'Alex' },
    { id: 'pt3', text: 'Practice inserting 10 elements and balancing', completed: false, assignee: 'Sam' },
    { id: 'pt4', text: 'Implement AVL insert with rotations in code', completed: false },
  ],
  p2: [
    { id: 'pt5', text: 'Re-watch lecture on eigenvalues', completed: true, assignee: 'Priya' },
    { id: 'pt6', text: 'Work through textbook examples 4.1-4.5', completed: true, assignee: 'Leo' },
    { id: 'pt7', text: 'Understand geometric interpretation', completed: true },
    { id: 'pt8', text: 'Practice finding eigenvalues of 3x3 matrix', completed: false, assignee: 'Alex' },
    { id: 'pt9', text: 'Complete practice problems set', completed: false },
    { id: 'pt10', text: 'Review diagonalization theorem', completed: false },
  ],
  p3: [
    { id: 'pt11', text: 'Get single pipe communication working', completed: true },
    { id: 'pt12', text: 'Implement multi-process pipeline', completed: false, assignee: 'Tomas' },
    { id: 'pt13', text: 'Handle error cases and zombie processes', completed: false, assignee: 'Alex' },
  ],
};

export const SOLO_TASKS: SoloTask[] = [
  { id: 'st1', text: 'Review CSC 202 lecture notes on heaps', courseCode: 'CSC 202', completed: true, isStuck: false, createdAt: '2 days ago' },
  { id: 'st2', text: 'Practice heap sort implementation', courseCode: 'CSC 202', completed: false, isStuck: false, createdAt: 'Yesterday' },
  { id: 'st3', text: 'Read Chapter 7 on graph algorithms', courseCode: 'CSC 202', completed: false, isStuck: true, createdAt: 'Yesterday' },
  { id: 'st4', text: 'Finish MATH 244 problem set 5', courseCode: 'MATH 244', completed: false, isStuck: false, createdAt: 'Today' },
  { id: 'st5', text: 'Write outline for PHIL 231 essay', courseCode: 'PHIL 231', completed: false, isStuck: false, createdAt: 'Today' },
  { id: 'st6', text: 'Review STAT 312 confidence intervals', courseCode: 'STAT 312', completed: true, isStuck: false, createdAt: '3 days ago' },
  { id: 'st7', text: 'Debug CSC 357 memory allocation lab', courseCode: 'CSC 357', completed: false, isStuck: true, createdAt: 'Today' },
];

export const COLLABORATION_PREFERENCES = [
  { key: 'text-only', label: 'Text Only', icon: 'message-square' },
  { key: 'online', label: 'Online Meeting', icon: 'video' },
  { key: 'in-person', label: 'In Person', icon: 'users' },
  { key: 'flexible', label: 'Flexible', icon: 'shuffle' },
] as const;
