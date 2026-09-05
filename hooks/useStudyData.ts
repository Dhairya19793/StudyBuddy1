import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useDemoUser, DemoProfile } from '@/contexts/DemoUserContext';
import type {
  Course,
  StudyRequest,
  Message,
  PeerPod,
  PodMember,
  SoloTask,
} from '@/constants/mockData';

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMin = Math.round((now - then) / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.round(diffH / 24);
  return `${diffD}d ago`;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function useCourses(): { data: Course[]; loading: boolean } {
  const { currentUser } = useDemoUser();
  const [data, setData] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      const { data: memberships } = await supabase
        .from('course_members')
        .select('course_id')
        .eq('profile_id', currentUser.id);

      if (cancelled || !memberships) return;
      const courseIds = memberships.map((m: any) => m.course_id);
      if (courseIds.length === 0) { setData([]); setLoading(false); return; }

      const { data: courses } = await supabase
        .from('courses')
        .select('*')
        .in('id', courseIds);

      if (cancelled || !courses) return;

      const enriched: Course[] = await Promise.all(
        courses.map(async (c: any) => {
          const { count: memberCount } = await supabase
            .from('course_members')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', c.id);

          const { count: activeRequests } = await supabase
            .from('study_requests')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', c.id)
            .eq('is_posted_to_hub', true);

          const { data: channel } = await supabase
            .from('channels')
            .select('id')
            .eq('course_id', c.id)
            .limit(1)
            .maybeSingle();

          let recentMessage: string | undefined;
          let recentMessageTime: string | undefined;

          if (channel) {
            const { data: msgs } = await supabase
              .from('messages')
              .select('body, created_at')
              .eq('channel_id', channel.id)
              .order('created_at', { ascending: false })
              .limit(1);

            if (msgs && msgs.length > 0) {
              recentMessage = msgs[0].body;
              recentMessageTime = timeAgo(msgs[0].created_at);
            }
          }

          return {
            id: c.id,
            code: c.code,
            name: c.name,
            department: c.department,
            color: c.color,
            memberCount: memberCount ?? 0,
            activeRequests: activeRequests ?? 0,
            recentMessage,
            recentMessageTime,
          };
        }),
      );

      if (!cancelled) {
        setData(enriched);
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [currentUser.id]);

  return { data, loading };
}

export function useStudyRequests(courseId?: string): {
  data: StudyRequest[];
  loading: boolean;
} {
  const { currentUser } = useDemoUser();
  const [data, setData] = useState<StudyRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      let query = supabase
        .from('study_requests')
        .select('*, profiles!study_requests_author_id_fkey(name, initials), courses!study_requests_course_id_fkey(code)')
        .eq('is_posted_to_hub', true)
        .order('created_at', { ascending: false });

      if (courseId) query = query.eq('course_id', courseId);

      const { data: requests } = await query;
      if (cancelled || !requests) return;

      const enriched: StudyRequest[] = await Promise.all(
        requests.map(async (r: any) => {
          const { count } = await supabase
            .from('request_interests')
            .select('*', { count: 'exact', head: true })
            .eq('request_id', r.id);

          const author = r.profiles;
          const course = r.courses;

          return {
            id: r.id,
            courseId: r.course_id,
            courseCode: course?.code ?? '',
            authorName: author?.name ?? 'Unknown',
            authorInitials: author?.initials ?? '?',
            helpNeeded: r.help_needed,
            topic: r.topic,
            availability: r.availability_text,
            preference: r.preference,
            groupSize: r.group_size,
            interestedCount: count ?? 0,
            createdAt: timeAgo(r.created_at),
            isPostedToHub: r.is_posted_to_hub,
          };
        }),
      );

      if (!cancelled) {
        setData(enriched);
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [courseId, currentUser.id]);

  return { data, loading };
}

export function useCourseMessages(courseId: string): {
  data: Message[];
  loading: boolean;
} {
  const { currentUser } = useDemoUser();
  const [data, setData] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      const { data: channel } = await supabase
        .from('channels')
        .select('id')
        .eq('course_id', courseId)
        .limit(1)
        .maybeSingle();

      if (cancelled || !channel) { setData([]); setLoading(false); return; }

      const { data: msgs } = await supabase
        .from('messages')
        .select('*, profiles!messages_author_id_fkey(name, initials)')
        .eq('channel_id', channel.id)
        .order('created_at', { ascending: true });

      if (cancelled || !msgs) return;

      const enriched: Message[] = msgs.map((m: any) => ({
        id: m.id,
        authorName: m.profiles?.name ?? 'Unknown',
        authorInitials: m.profiles?.initials ?? '?',
        text: m.body,
        timestamp: formatTime(m.created_at),
        isStudyRequest: m.is_study_request,
        studyRequestId: m.study_request_id,
        isOwn: m.author_id === currentUser.id,
      }));

      if (!cancelled) {
        setData(enriched);
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [courseId, currentUser.id]);

  return { data, loading };
}

export function usePods(): { data: PeerPod[]; loading: boolean } {
  const { currentUser } = useDemoUser();
  const [data, setData] = useState<PeerPod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      const { data: memberships } = await supabase
        .from('pod_members')
        .select('pod_id')
        .eq('profile_id', currentUser.id);

      if (cancelled || !memberships) return;
      const podIds = memberships.map((m: any) => m.pod_id);
      if (podIds.length === 0) { setData([]); setLoading(false); return; }

      const { data: pods } = await supabase
        .from('pods')
        .select('*, courses!pods_course_id_fkey(code)')
        .in('id', podIds);

      if (cancelled || !pods) return;

      const enriched: PeerPod[] = await Promise.all(
        pods.map(async (p: any) => {
          const { data: memberRows } = await supabase
            .from('pod_members')
            .select('profiles!pod_members_profile_id_fkey(id, name, initials, instagram, discord)')
            .eq('pod_id', p.id);

          const members: PodMember[] = (memberRows ?? []).map((mr: any) => ({
            id: mr.profiles.id,
            name: mr.profiles.name,
            initials: mr.profiles.initials,
            instagram: mr.profiles.instagram ?? undefined,
            discord: mr.profiles.discord ?? undefined,
          }));

          const { data: allTasks } = await supabase
            .from('tasks')
            .select('completed')
            .eq('pod_id', p.id);

          const tasksTotal = allTasks?.length ?? 0;
          const tasksDone = allTasks?.filter((t: any) => t.completed).length ?? 0;

          const { data: channel } = await supabase
            .from('channels')
            .select('id')
            .eq('pod_id', p.id)
            .limit(1)
            .maybeSingle();

          let lastMessage: string | undefined;
          let lastMessageTime: string | undefined;

          if (channel) {
            const { data: msgs } = await supabase
              .from('messages')
              .select('body, created_at')
              .eq('channel_id', channel.id)
              .order('created_at', { ascending: false })
              .limit(1);

            if (msgs && msgs.length > 0) {
              lastMessage = msgs[0].body;
              lastMessageTime = timeAgo(msgs[0].created_at);
            }
          }

          return {
            id: p.id,
            name: p.name,
            courseCode: p.courses?.code ?? '',
            topic: p.topic,
            members,
            lastMessage,
            lastMessageTime,
            tasksTotal,
            tasksDone,
          };
        }),
      );

      if (!cancelled) {
        setData(enriched);
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [currentUser.id]);

  return { data, loading };
}

export function usePodMessages(podId: string): {
  data: Message[];
  loading: boolean;
} {
  const { currentUser } = useDemoUser();
  const [data, setData] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      const { data: channel } = await supabase
        .from('channels')
        .select('id')
        .eq('pod_id', podId)
        .limit(1)
        .maybeSingle();

      if (cancelled || !channel) { setData([]); setLoading(false); return; }

      const { data: msgs } = await supabase
        .from('messages')
        .select('*, profiles!messages_author_id_fkey(name, initials)')
        .eq('channel_id', channel.id)
        .order('created_at', { ascending: true });

      if (cancelled || !msgs) return;

      const enriched: Message[] = msgs.map((m: any) => ({
        id: m.id,
        authorName: m.profiles?.name ?? 'Unknown',
        authorInitials: m.profiles?.initials ?? '?',
        text: m.body,
        timestamp: formatTime(m.created_at),
        isStudyRequest: m.is_study_request,
        studyRequestId: m.study_request_id,
        isOwn: m.author_id === currentUser.id,
      }));

      if (!cancelled) {
        setData(enriched);
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [podId, currentUser.id]);

  return { data, loading };
}

export function usePodTasks(podId: string): {
  data: { id: string; text: string; completed: boolean; assignee?: string }[];
  loading: boolean;
} {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*, profiles!tasks_assignee_id_fkey(name)')
        .eq('pod_id', podId)
        .order('created_at', { ascending: true });

      if (cancelled || !tasks) return;

      const enriched = tasks.map((t: any) => ({
        id: t.id,
        text: t.text,
        completed: t.completed,
        assignee: t.profiles?.name?.split(' ')[0],
      }));

      if (!cancelled) {
        setData(enriched);
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [podId]);

  return { data, loading };
}

export function useSoloTasks(): {
  data: SoloTask[];
  loading: boolean;
  addTask: (text: string, courseId: string | null) => Promise<void>;
  toggleComplete: (id: string) => Promise<void>;
  toggleStuck: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
} {
  const { currentUser } = useDemoUser();
  const [data, setData] = useState<SoloTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    const { data: tasks } = await supabase
      .from('task_completions')
      .select('*, courses!task_completions_course_id_fkey(code)')
      .eq('profile_id', currentUser.id)
      .order('created_at', { ascending: false });

    if (!tasks) return;

    const enriched: SoloTask[] = tasks.map((t: any) => ({
      id: t.id,
      text: t.text,
      courseCode: t.courses?.code ?? undefined,
      completed: t.completed,
      isStuck: t.is_stuck,
      createdAt: timeAgo(t.created_at),
    }));

    setData(enriched);
    setLoading(false);
  }, [currentUser.id]);

  useEffect(() => {
    setLoading(true);
    fetchTasks();
  }, [fetchTasks]);

  const addTask = useCallback(
    async (text: string, courseId: string | null) => {
      await supabase.from('task_completions').insert({
        profile_id: currentUser.id,
        text,
        course_id: courseId,
      });
      await fetchTasks();
    },
    [currentUser.id, fetchTasks],
  );

  const toggleComplete = useCallback(
    async (id: string) => {
      const task = data.find((t) => t.id === id);
      if (!task) return;
      await supabase
        .from('task_completions')
        .update({
          completed: !task.completed,
          is_stuck: !task.completed ? false : task.isStuck,
        })
        .eq('id', id);
      await fetchTasks();
    },
    [data, fetchTasks],
  );

  const toggleStuck = useCallback(
    async (id: string) => {
      const task = data.find((t) => t.id === id);
      if (!task) return;
      await supabase
        .from('task_completions')
        .update({ is_stuck: !task.isStuck })
        .eq('id', id);
      await fetchTasks();
    },
    [data, fetchTasks],
  );

  const deleteTask = useCallback(
    async (id: string) => {
      await supabase.from('task_completions').delete().eq('id', id);
      await fetchTasks();
    },
    [fetchTasks],
  );

  return { data, loading, addTask, toggleComplete, toggleStuck, deleteTask };
}

export function useAvailabilityOverlap(otherUserId: string): {
  windows: string[];
  loading: boolean;
} {
  const { currentUser } = useDemoUser();
  const [windows, setWindows] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      const [{ data: myBlocks }, { data: theirBlocks }] = await Promise.all([
        supabase
          .from('availability_blocks')
          .select('day_of_week, start_time, end_time')
          .eq('profile_id', currentUser.id),
        supabase
          .from('availability_blocks')
          .select('day_of_week, start_time, end_time')
          .eq('profile_id', otherUserId),
      ]);

      if (cancelled) return;

      const overlaps: string[] = [];

      for (const mine of myBlocks ?? []) {
        for (const theirs of theirBlocks ?? []) {
          if (mine.day_of_week !== theirs.day_of_week) continue;

          const overlapStart = mine.start_time > theirs.start_time ? mine.start_time : theirs.start_time;
          const overlapEnd = mine.end_time < theirs.end_time ? mine.end_time : theirs.end_time;

          if (overlapStart < overlapEnd) {
            const fmt = (t: string) => {
              const [h, m] = t.split(':').map(Number);
              const ampm = h >= 12 ? 'PM' : 'AM';
              const hr = h % 12 || 12;
              return m === 0 ? `${hr} ${ampm}` : `${hr}:${String(m).padStart(2, '0')} ${ampm}`;
            };
            overlaps.push(`${mine.day_of_week} ${fmt(overlapStart)}-${fmt(overlapEnd)}`);
          }
        }
      }

      if (!cancelled) {
        setWindows(overlaps);
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [currentUser.id, otherUserId]);

  return { windows, loading };
}
