import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useDemoUser } from '@/contexts/DemoUserContext';
import type {
  Course,
  StudyRequest,
  HelpType,
  Message,
  PeerPod,
  PodMember,
  SoloTask,
  StudyPlan,
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

// ────────────────────────────────────────────────────────────
// COURSES
// ────────────────────────────────────────────────────────────

export function useCourses(): { data: Course[]; loading: boolean; refetch: () => void } {
  const { currentUser } = useDemoUser();
  const [data, setData] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const refetch = useCallback(() => setTick((t) => t + 1), []);

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
  }, [currentUser.id, tick]);

  return { data, loading, refetch };
}

// ────────────────────────────────────────────────────────────
// STUDY REQUESTS
// ────────────────────────────────────────────────────────────

export function useStudyRequests(courseId?: string): {
  data: StudyRequest[];
  loading: boolean;
  refetch: () => void;
} {
  const { currentUser } = useDemoUser();
  const [data, setData] = useState<StudyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      let query = supabase
        .from('study_requests')
        .select('*, profiles!study_requests_author_id_fkey(id, name, initials), courses!study_requests_course_id_fkey(code)')
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
            authorId: author?.id ?? '',
            authorName: author?.name ?? 'Unknown',
            authorInitials: author?.initials ?? '?',
            helpType: (r.help_type ?? 'understand-concept') as HelpType,
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
  }, [courseId, currentUser.id, tick]);

  return { data, loading, refetch };
}

// ────────────────────────────────────────────────────────────
// CREATE STUDY REQUEST
// ────────────────────────────────────────────────────────────

export function useCreateStudyRequest() {
  const { currentUser } = useDemoUser();

  return useCallback(
    async (fields: {
      courseId: string;
      helpType: HelpType;
      helpNeeded: string;
      topic: string;
      availability: string;
      preference: string;
      groupSize: number;
      postToHub: boolean;
    }) => {
      const { data, error } = await supabase
        .from('study_requests')
        .insert({
          course_id: fields.courseId,
          author_id: currentUser.id,
          help_type: fields.helpType,
          help_needed: fields.helpNeeded,
          topic: fields.topic,
          availability_text: fields.availability,
          preference: fields.preference,
          group_size: fields.groupSize,
          is_posted_to_hub: fields.postToHub,
        })
        .select('id')
        .single();

      if (error) throw error;

      return data.id;
    },
    [currentUser.id],
  );
}

// ────────────────────────────────────────────────────────────
// MY INTERESTS (which study requests has the current user liked?)
// ────────────────────────────────────────────────────────────

export function useMyInterests(): {
  interestedIds: Set<string>;
  loading: boolean;
  refetch: () => void;
} {
  const { currentUser } = useDemoUser();
  const [interestedIds, setInterestedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data } = await supabase
        .from('request_interests')
        .select('request_id')
        .eq('profile_id', currentUser.id);

      if (cancelled) return;
      setInterestedIds(new Set((data ?? []).map((r: any) => r.request_id)));
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [currentUser.id, tick]);

  return { interestedIds, loading, refetch };
}

// ────────────────────────────────────────────────────────────
// TOGGLE INTEREST
// ────────────────────────────────────────────────────────────

export function useToggleInterest() {
  const { currentUser } = useDemoUser();

  return useCallback(
    async (requestId: string, alreadyInterested: boolean) => {
      if (alreadyInterested) {
        await supabase
          .from('request_interests')
          .delete()
          .eq('request_id', requestId)
          .eq('profile_id', currentUser.id);
      } else {
        await supabase.from('request_interests').insert({
          request_id: requestId,
          profile_id: currentUser.id,
        });
      }
    },
    [currentUser.id],
  );
}

// ────────────────────────────────────────────────────────────
// COURSE MESSAGES
// ────────────────────────────────────────────────────────────

export function useCourseMessages(courseId: string): {
  data: Message[];
  loading: boolean;
  refetch: () => void;
  sendMessage: (text: string) => Promise<void>;
} {
  const { currentUser } = useDemoUser();
  const [data, setData] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const refetch = useCallback(() => setTick((t) => t + 1), []);
  const channelIdRef = useRef<string | null>(null);

  const enrichRow = useCallback(
    (m: any): Message => ({
      id: m.id,
      authorName: m.profiles?.name ?? 'Unknown',
      authorInitials: m.profiles?.initials ?? '?',
      text: m.body,
      timestamp: formatTime(m.created_at),
      isStudyRequest: m.is_study_request,
      studyRequestId: m.study_request_id,
      isOwn: m.author_id === currentUser.id,
    }),
    [currentUser.id],
  );

  useEffect(() => {
    let cancelled = false;
    let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;
    setLoading(true);

    (async () => {
      const { data: channel } = await supabase
        .from('channels')
        .select('id')
        .eq('course_id', courseId)
        .limit(1)
        .maybeSingle();

      if (cancelled || !channel) { setData([]); setLoading(false); return; }
      channelIdRef.current = channel.id;

      const { data: msgs } = await supabase
        .from('messages')
        .select('*, profiles!messages_author_id_fkey(name, initials)')
        .eq('channel_id', channel.id)
        .order('created_at', { ascending: true });

      if (cancelled || !msgs) return;

      const enriched: Message[] = msgs.map((m: any) => enrichRow(m));

      if (!cancelled) {
        setData(enriched);
        setLoading(false);
      }

      if (!cancelled) {
        realtimeChannel = supabase
          .channel(`course-messages-${courseId}`)
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'messages', filter: `channel_id=eq.${channel.id}` },
            async (payload) => {
              const newRow = payload.new as any;
              const { data: msgFull } = await supabase
                .from('messages')
                .select('*, profiles!messages_author_id_fkey(name, initials)')
                .eq('id', newRow.id)
                .single();
              if (!msgFull) return;
              const newMessage = enrichRow(msgFull);
              setData((prev) => (prev.some((m) => m.id === newMessage.id) ? prev : [...prev, newMessage]));
            },
          )
          .subscribe();
      }
    })();

    return () => {
      cancelled = true;
      if (realtimeChannel) supabase.removeChannel(realtimeChannel);
    };
  }, [courseId, currentUser.id, tick, enrichRow]);

  const sendMessage = useCallback(
    async (text: string) => {
      const chId = channelIdRef.current;
      if (!chId) return;
      await supabase.from('messages').insert({
        channel_id: chId,
        author_id: currentUser.id,
        body: text,
        is_study_request: false,
      });
    },
    [currentUser.id],
  );

  return { data, loading, refetch, sendMessage };
}

// ────────────────────────────────────────────────────────────
// PODS
// ────────────────────────────────────────────────────────────

export function usePods(): { data: PeerPod[]; loading: boolean; refetch: () => void } {
  const { currentUser } = useDemoUser();
  const [data, setData] = useState<PeerPod[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const refetch = useCallback(() => setTick((t) => t + 1), []);

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
  }, [currentUser.id, tick]);

  return { data, loading, refetch };
}

// ────────────────────────────────────────────────────────────
// POD MESSAGES  (with sendMessage + Realtime)
// ────────────────────────────────────────────────────────────

export function usePodMessages(podId: string): {
  data: Message[];
  loading: boolean;
  refetch: () => void;
  sendMessage: (text: string, opts?: { label?: string; imageUri?: string; imageName?: string; imageMimeType?: string }) => Promise<void>;
  togglePin: (messageId: string, currentlyPinned: boolean) => Promise<void>;
  markResolved: (messageId: string) => Promise<void>;
} {
  const { currentUser } = useDemoUser();
  const [data, setData] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const refetch = useCallback(() => setTick((t) => t + 1), []);
  const channelIdRef = useRef<string | null>(null);

  const enrichRow = useCallback(
    (m: any, attachment?: any): Message => ({
      id: m.id,
      authorName: m.profiles?.name ?? 'Unknown',
      authorInitials: m.profiles?.initials ?? '?',
      text: m.body,
      timestamp: formatTime(m.created_at),
      isStudyRequest: m.is_study_request,
      studyRequestId: m.study_request_id,
      isOwn: m.author_id === currentUser.id,
      label: m.label ?? null,
      isPinned: m.is_pinned ?? false,
      isResolved: m.is_resolved ?? false,
      imageUrl: attachment?.url ?? null,
      imageName: attachment?.filename ?? null,
    }),
    [currentUser.id],
  );

  useEffect(() => {
    let cancelled = false;
    let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;
    setLoading(true);

    (async () => {
      const { data: ch } = await supabase
        .from('channels')
        .select('id')
        .eq('pod_id', podId)
        .limit(1)
        .maybeSingle();

      if (cancelled || !ch) { setData([]); setLoading(false); return; }
      channelIdRef.current = ch.id;

      const { data: msgs } = await supabase
        .from('messages')
        .select('*, profiles!messages_author_id_fkey(name, initials), attachments(*)')
        .eq('channel_id', ch.id)
        .order('created_at', { ascending: true });

      if (cancelled || !msgs) return;

      const enriched: Message[] = msgs.map((m: any) => {
        const att = m.attachments?.[0] ?? null;
        return enrichRow(m, att);
      });

      if (!cancelled) {
        setData(enriched);
        setLoading(false);
      }

      if (!cancelled) {
        realtimeChannel = supabase
          .channel(`pod-messages-${podId}`)
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'messages', filter: `channel_id=eq.${ch.id}` },
            async (payload) => {
              const newRow = payload.new as any;
              const { data: msgFull } = await supabase
                .from('messages')
                .select('*, profiles!messages_author_id_fkey(name, initials), attachments(*)')
                .eq('id', newRow.id)
                .single();
              if (!msgFull) return;
              const att = (msgFull as any).attachments?.[0] ?? null;
              const newMessage = enrichRow(msgFull, att);
              setData((prev) => (prev.some((m) => m.id === newMessage.id) ? prev : [...prev, newMessage]));
            },
          )
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'messages', filter: `channel_id=eq.${ch.id}` },
            async (payload) => {
              const updatedRow = payload.new as any;
              setData((prev) =>
                prev.map((m) =>
                  m.id === updatedRow.id
                    ? { ...m, isPinned: updatedRow.is_pinned, isResolved: updatedRow.is_resolved, label: updatedRow.label }
                    : m,
                ),
              );
            },
          )
          .subscribe();
      }
    })();

    return () => {
      cancelled = true;
      if (realtimeChannel) supabase.removeChannel(realtimeChannel);
    };
  }, [podId, currentUser.id, tick, enrichRow]);

  const sendMessage = useCallback(
    async (text: string, opts?: { label?: string; imageUri?: string; imageName?: string; imageMimeType?: string }) => {
      const chId = channelIdRef.current;
      if (!chId) return;

      let attachmentUrl: string | null = null;
      let attachmentFilename: string | null = null;
      let attachmentMime = 'image/png';

      if (opts?.imageUri) {
        const fileName = `${podId}/${Date.now()}-${opts.imageName ?? 'image.png'}`;
        attachmentMime = opts.imageMimeType ?? 'image/png';

        const response = await fetch(opts.imageUri);
        const blob = await response.blob();

        const { error: uploadError } = await supabase.storage
          .from('pod-images')
          .upload(fileName, blob, { contentType: attachmentMime, upsert: false });

        if (uploadError) {
          console.error('Upload failed:', uploadError.message);
          throw new Error('Image upload failed');
        }

        const { data: urlData } = supabase.storage.from('pod-images').getPublicUrl(fileName);
        attachmentUrl = urlData.publicUrl;
        attachmentFilename = opts.imageName ?? 'image.png';
      }

      const { data: msgRow, error } = await supabase
        .from('messages')
        .insert({
          channel_id: chId,
          author_id: currentUser.id,
          body: text || (attachmentFilename ? `Shared ${attachmentFilename}` : ''),
          is_study_request: false,
          label: opts?.label ?? null,
        })
        .select('id')
        .single();

      if (error || !msgRow) return;

      if (attachmentUrl && attachmentFilename) {
        await supabase.from('attachments').insert({
          message_id: msgRow.id,
          url: attachmentUrl,
          filename: attachmentFilename,
          content_type: attachmentMime,
        });
      }
    },
    [currentUser.id, podId],
  );

  const togglePin = useCallback(
    async (messageId: string, currentlyPinned: boolean) => {
      await supabase.from('messages').update({ is_pinned: !currentlyPinned }).eq('id', messageId);
    },
    [],
  );

  const markResolved = useCallback(
    async (messageId: string) => {
      await supabase.from('messages').update({ is_resolved: true }).eq('id', messageId);
    },
    [],
  );

  return { data, loading, refetch, sendMessage, togglePin, markResolved };
}

// ────────────────────────────────────────────────────────────
// POD TASKS  (with addTask, toggleTask + Realtime)
// ────────────────────────────────────────────────────────────

export function usePodTasks(podId: string): {
  data: { id: string; text: string; completed: boolean; assignee?: string }[];
  loading: boolean;
  refetch: () => void;
  addTask: (text: string) => Promise<void>;
  toggleTask: (taskId: string) => Promise<void>;
} {
  const { currentUser } = useDemoUser();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;
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

      // Subscribe to realtime INSERT and UPDATE events on tasks for this pod
      if (!cancelled) {
        realtimeChannel = supabase
          .channel(`pod-tasks-${podId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'tasks',
              filter: `pod_id=eq.${podId}`,
            },
            async (payload) => {
              const newRow = payload.new as any;

              // Fetch with profile join
              const { data: taskWithProfile } = await supabase
                .from('tasks')
                .select('*, profiles!tasks_assignee_id_fkey(name)')
                .eq('id', newRow.id)
                .single();

              if (!taskWithProfile) return;

              const newTask = {
                id: taskWithProfile.id,
                text: taskWithProfile.text,
                completed: taskWithProfile.completed,
                assignee: taskWithProfile.profiles?.name?.split(' ')[0],
              };

              setData((prev) => {
                if (prev.some((t: any) => t.id === newTask.id)) return prev;
                return [...prev, newTask];
              });
            },
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'tasks',
              filter: `pod_id=eq.${podId}`,
            },
            async (payload) => {
              const updatedRow = payload.new as any;

              // Fetch with profile join
              const { data: taskWithProfile } = await supabase
                .from('tasks')
                .select('*, profiles!tasks_assignee_id_fkey(name)')
                .eq('id', updatedRow.id)
                .single();

              if (!taskWithProfile) return;

              const updatedTask = {
                id: taskWithProfile.id,
                text: taskWithProfile.text,
                completed: taskWithProfile.completed,
                assignee: taskWithProfile.profiles?.name?.split(' ')[0],
              };

              setData((prev) =>
                prev.map((t: any) => (t.id === updatedTask.id ? updatedTask : t)),
              );
            },
          )
          .subscribe();
      }
    })();

    return () => {
      cancelled = true;
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, [podId, tick]);

  const addTask = useCallback(
    async (text: string) => {
      await supabase.from('tasks').insert({
        pod_id: podId,
        text,
        completed: false,
      });
      // Realtime will handle appending
    },
    [podId],
  );

  const toggleTask = useCallback(
    async (taskId: string) => {
      const task = data.find((t: any) => t.id === taskId);
      if (!task) return;
      await supabase
        .from('tasks')
        .update({ completed: !task.completed })
        .eq('id', taskId);
      // Realtime will handle updating
    },
    [data],
  );

  return { data, loading, refetch, addTask, toggleTask };
}

// ────────────────────────────────────────────────────────────
// SOLO TASKS
// ────────────────────────────────────────────────────────────

export function useSoloTasks(): {
  data: SoloTask[];
  loading: boolean;
  addTask: (text: string, courseId: string | null, planId?: string, durationMinutes?: number) => Promise<void>;
  toggleComplete: (id: string) => Promise<void>;
  toggleStuck: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  updateTask: (id: string, fields: { text?: string; duration_minutes?: number; sort_order?: number }) => Promise<void>;
} {
  const { currentUser } = useDemoUser();
  const [data, setData] = useState<SoloTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    const { data: tasks } = await supabase
      .from('task_completions')
      .select('*, courses!task_completions_course_id_fkey(code)')
      .eq('profile_id', currentUser.id)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (!tasks) return;

    const enriched: SoloTask[] = tasks.map((t: any) => ({
      id: t.id,
      text: t.text,
      courseCode: t.courses?.code ?? undefined,
      courseId: t.course_id ?? undefined,
      planId: t.plan_id ?? undefined,
      completed: t.completed,
      isStuck: t.is_stuck,
      durationMinutes: t.duration_minutes ?? undefined,
      sortOrder: t.sort_order ?? 0,
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
    async (text: string, courseId: string | null, planId?: string, durationMinutes?: number) => {
      const maxSort = data.filter((t) => t.planId === planId).reduce((m, t) => Math.max(m, t.sortOrder), -1);
      await supabase.from('task_completions').insert({
        profile_id: currentUser.id,
        text,
        course_id: courseId,
        plan_id: planId ?? null,
        duration_minutes: durationMinutes ?? null,
        sort_order: maxSort + 1,
      });
      await fetchTasks();
    },
    [currentUser.id, fetchTasks, data],
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

  const updateTask = useCallback(
    async (id: string, fields: { text?: string; duration_minutes?: number; sort_order?: number }) => {
      await supabase.from('task_completions').update(fields).eq('id', id);
      await fetchTasks();
    },
    [fetchTasks],
  );

  return { data, loading, addTask, toggleComplete, toggleStuck, deleteTask, updateTask };
}

// ────────────────────────────────────────────────────────────
// STUDY PLANS
// ────────────────────────────────────────────────────────────

export function useStudyPlans(): {
  data: StudyPlan[];
  loading: boolean;
  refetch: () => void;
  createPlan: (fields: { courseId: string; title: string; dueDate?: string; note?: string }) => Promise<string>;
  updatePlan: (id: string, fields: { title?: string; due_date?: string | null; note?: string | null }) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
} {
  const { currentUser } = useDemoUser();
  const [data, setData] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      const { data: plans } = await supabase
        .from('study_plans')
        .select('*, courses!study_plans_course_id_fkey(code)')
        .eq('profile_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (cancelled || !plans) { setLoading(false); return; }

      const { data: allTasks } = await supabase
        .from('task_completions')
        .select('*, courses!task_completions_course_id_fkey(code)')
        .eq('profile_id', currentUser.id)
        .not('plan_id', 'is', null)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (cancelled) return;

      const tasksByPlan = new Map<string, SoloTask[]>();
      (allTasks ?? []).forEach((t: any) => {
        const task: SoloTask = {
          id: t.id,
          text: t.text,
          courseCode: t.courses?.code ?? undefined,
          courseId: t.course_id ?? undefined,
          planId: t.plan_id ?? undefined,
          completed: t.completed,
          isStuck: t.is_stuck,
          durationMinutes: t.duration_minutes ?? undefined,
          sortOrder: t.sort_order ?? 0,
          createdAt: timeAgo(t.created_at),
        };
        const list = tasksByPlan.get(t.plan_id) ?? [];
        list.push(task);
        tasksByPlan.set(t.plan_id, list);
      });

      const enriched: StudyPlan[] = plans.map((p: any) => ({
        id: p.id,
        profileId: p.profile_id,
        courseId: p.course_id,
        courseCode: p.courses?.code ?? '',
        title: p.title,
        dueDate: p.due_date ?? undefined,
        note: p.note ?? undefined,
        tasks: tasksByPlan.get(p.id) ?? [],
        createdAt: timeAgo(p.created_at),
      }));

      if (!cancelled) {
        setData(enriched);
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [currentUser.id, tick]);

  const createPlan = useCallback(
    async (fields: { courseId: string; title: string; dueDate?: string; note?: string }) => {
      const { data: row, error } = await supabase
        .from('study_plans')
        .insert({
          profile_id: currentUser.id,
          course_id: fields.courseId,
          title: fields.title,
          due_date: fields.dueDate ?? null,
          note: fields.note ?? null,
        })
        .select('id')
        .single();
      if (error || !row) throw new Error('Failed to create plan');
      refetch();
      return row.id;
    },
    [currentUser.id, refetch],
  );

  const updatePlan = useCallback(
    async (id: string, fields: { title?: string; due_date?: string | null; note?: string | null }) => {
      await supabase.from('study_plans').update(fields).eq('id', id);
      refetch();
    },
    [refetch],
  );

  const deletePlan = useCallback(
    async (id: string) => {
      await supabase.from('study_plans').delete().eq('id', id);
      refetch();
    },
    [refetch],
  );

  return { data, loading, refetch, createPlan, updatePlan, deletePlan };
}

// ────────────────────────────────────────────────────────────
// ALL COURSES (for browse/join)
// ────────────────────────────────────────────────────────────

export function useAllCourses(): {
  data: { id: string; code: string; name: string; department: string; color: string; memberCount: number }[];
  loading: boolean;
  refetch: () => void;
} {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      const { data: courses } = await supabase.from('courses').select('*');
      if (cancelled || !courses) { setLoading(false); return; }

      const enriched = await Promise.all(
        courses.map(async (c: any) => {
          const { count } = await supabase
            .from('course_members')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', c.id);
          return { id: c.id, code: c.code, name: c.name, department: c.department, color: c.color, memberCount: count ?? 0 };
        }),
      );

      if (!cancelled) { setData(enriched); setLoading(false); }
    })();

    return () => { cancelled = true; };
  }, [tick]);

  return { data, loading, refetch };
}

// ────────────────────────────────────────────────────────────
// JOIN / LEAVE COURSE HUB
// ────────────────────────────────────────────────────────────

export function useJoinCourse() {
  const { currentUser } = useDemoUser();

  const join = useCallback(
    async (courseId: string) => {
      await supabase.from('course_members').upsert(
        { profile_id: currentUser.id, course_id: courseId },
        { onConflict: 'profile_id,course_id' },
      );
    },
    [currentUser.id],
  );

  const leave = useCallback(
    async (courseId: string) => {
      await supabase
        .from('course_members')
        .delete()
        .eq('profile_id', currentUser.id)
        .eq('course_id', courseId);
    },
    [currentUser.id],
  );

  return { join, leave };
}

// ────────────────────────────────────────────────────────────
// AVAILABILITY OVERLAP
// ────────────────────────────────────────────────────────────

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

// ────────────────────────────────────────────────────────────
// CREATE POD
// ────────────────────────────────────────────────────────────

export function useCreatePod() {
  const { currentUser } = useDemoUser();

  return useCallback(
    async (fields: {
      name: string;
      courseId: string;
      topic: string;
      memberIds: string[]; // includes creator
    }) => {
      // 1. Insert the pod
      const { data: pod, error } = await supabase
        .from('pods')
        .insert({
          name: fields.name,
          course_id: fields.courseId,
          topic: fields.topic,
        })
        .select('id')
        .single();

      if (error || !pod) throw error ?? new Error('Failed to create pod');

      // 2. Insert pod_members for each memberId
      const memberRows = fields.memberIds.map((id) => ({
        pod_id: pod.id,
        profile_id: id,
      }));
      await supabase.from('pod_members').insert(memberRows);

      // 3. Create a private channel for the pod
      await supabase.from('channels').insert({
        pod_id: pod.id,
        name: 'general',
      });

      return pod.id;
    },
    [currentUser.id],
  );
}

// ────────────────────────────────────────────────────────────
// REQUEST INTEREST USERS
// ────────────────────────────────────────────────────────────

export function useRequestInterestUsers(requestId: string): {
  data: { id: string; name: string; initials: string }[];
  loading: boolean;
  refetch: () => void;
} {
  const [data, setData] = useState<{ id: string; name: string; initials: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      const { data: interests } = await supabase
        .from('request_interests')
        .select('profiles!request_interests_profile_id_fkey(id, name, initials)')
        .eq('request_id', requestId);

      if (cancelled) return;

      const users = (interests ?? []).map((row: any) => ({
        id: row.profiles?.id ?? '',
        name: row.profiles?.name ?? 'Unknown',
        initials: row.profiles?.initials ?? '?',
      }));

      if (!cancelled) {
        setData(users);
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [requestId, tick]);

  return { data, loading, refetch };
}

// ────────────────────────────────────────────────────────────
// SAVE AVAILABILITY BLOCKS
// ────────────────────────────────────────────────────────────

export function useSaveAvailabilityBlocks() {
  const { currentUser } = useDemoUser();

  return useCallback(
    async (
      blocks: { day: string; startTime: string; endTime: string }[],
      studyRequestId?: string,
    ) => {
      // Delete existing blocks for this user + study_request_id combo
      if (studyRequestId) {
        await supabase
          .from('availability_blocks')
          .delete()
          .eq('profile_id', currentUser.id)
          .eq('study_request_id', studyRequestId);
      }

      if (blocks.length === 0) return;

      const rows = blocks.map((b) => ({
        profile_id: currentUser.id,
        day_of_week: b.day,
        start_time: b.startTime,
        end_time: b.endTime,
        study_request_id: studyRequestId ?? null,
      }));

      await supabase.from('availability_blocks').insert(rows);
    },
    [currentUser.id],
  );
}

// ────────────────────────────────────────────────────────────
// CONVERSATIONS (Messages inbox)
// ────────────────────────────────────────────────────────────

export interface Conversation {
  channelId: string;
  name: string;
  type: 'course' | 'pod' | 'dm';
  entityId: string;
  otherUserId?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  lastMessageAt?: string;
  unreadCount: number;
  initials: string;
  color: string;
}

export function useConversations(): {
  data: Conversation[];
  loading: boolean;
  totalUnread: number;
  refetch: () => void;
} {
  const { currentUser } = useDemoUser();
  const [data, setData] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      // 1. Get all course memberships
      const { data: courseMemberships } = await supabase
        .from('course_members')
        .select('course_id')
        .eq('profile_id', currentUser.id);

      // 2. Get all pod memberships
      const { data: podMemberships } = await supabase
        .from('pod_members')
        .select('pod_id')
        .eq('profile_id', currentUser.id);

      if (cancelled) return;

      const courseIds = (courseMemberships ?? []).map((m: any) => m.course_id);
      const podIds = (podMemberships ?? []).map((m: any) => m.pod_id);

      // 3. Get all channels for these courses, pods, and DMs
      let allChannels: any[] = [];
      if (courseIds.length > 0) {
        const { data: courseChannels } = await supabase
          .from('channels')
          .select('id, course_id, pod_id, name, is_direct, user1_id, user2_id')
          .in('course_id', courseIds);
        allChannels = allChannels.concat(courseChannels ?? []);
      }
      if (podIds.length > 0) {
        const { data: podChannels } = await supabase
          .from('channels')
          .select('id, course_id, pod_id, name, is_direct, user1_id, user2_id')
          .in('pod_id', podIds);
        allChannels = allChannels.concat(podChannels ?? []);
      }
      // Get DM channels where current user is a participant
      const { data: dmChannels1 } = await supabase
        .from('channels')
        .select('id, course_id, pod_id, name, is_direct, user1_id, user2_id')
        .eq('is_direct', true)
        .eq('user1_id', currentUser.id);
      const { data: dmChannels2 } = await supabase
        .from('channels')
        .select('id, course_id, pod_id, name, is_direct, user1_id, user2_id')
        .eq('is_direct', true)
        .eq('user2_id', currentUser.id);
      allChannels = allChannels.concat(dmChannels1 ?? [], dmChannels2 ?? []);
      // Deduplicate by id
      const seenIds = new Set<string>();
      allChannels = allChannels.filter((ch) => {
        if (seenIds.has(ch.id)) return false;
        seenIds.add(ch.id);
        return true;
      });

      if (cancelled) return;
      if (allChannels.length === 0) { setData([]); setLoading(false); return; }

      const channelIds = allChannels.map((c) => c.id);

      // 4. Get last read timestamps
      const { data: reads } = await supabase
        .from('channel_reads')
        .select('channel_id, last_read_at')
        .eq('profile_id', currentUser.id)
        .in('channel_id', channelIds);

      const readMap = new Map<string, string>();
      (reads ?? []).forEach((r: any) => readMap.set(r.channel_id, r.last_read_at));

      // 5. Get course and pod details
      const courseMap = new Map<string, any>();
      const podMap = new Map<string, any>();

      if (courseIds.length > 0) {
        const { data: courses } = await supabase.from('courses').select('*').in('id', courseIds);
        (courses ?? []).forEach((c: any) => courseMap.set(c.id, c));
      }
      if (podIds.length > 0) {
        const { data: pods } = await supabase.from('pods').select('*, courses!pods_course_id_fkey(code)').in('id', podIds);
        (pods ?? []).forEach((p: any) => podMap.set(p.id, p));
      }

      if (cancelled) return;

      // 6. Build conversations
      const conversations: Conversation[] = await Promise.all(
        allChannels.map(async (ch) => {
          const isCourse = !!ch.course_id;
          const entityId = isCourse ? ch.course_id : ch.pod_id;

          // Get last message
          const { data: lastMsgs } = await supabase
            .from('messages')
            .select('body, created_at')
            .eq('channel_id', ch.id)
            .order('created_at', { ascending: false })
            .limit(1);

          const lastMsg = lastMsgs?.[0];

          // Get unread count
          const lastRead = readMap.get(ch.id);
          let unreadCount = 0;
          if (lastRead) {
            const { count } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('channel_id', ch.id)
              .gt('created_at', lastRead)
              .neq('author_id', currentUser.id);
            unreadCount = count ?? 0;
          } else if (lastMsg) {
            const { count } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('channel_id', ch.id)
              .neq('author_id', currentUser.id);
            unreadCount = count ?? 0;
          }

          if (ch.is_direct) {
            // DM channel — get the other user's info
            const otherUserId = ch.user1_id === currentUser.id ? ch.user2_id : ch.user1_id;
            const { data: otherUser } = await supabase
              .from('profiles')
              .select('name, initials')
              .eq('id', otherUserId)
              .maybeSingle();
            return {
              channelId: ch.id,
              name: otherUser?.name ?? 'Direct Message',
              type: 'dm' as const,
              entityId: ch.id,
              otherUserId,
              lastMessage: lastMsg?.body,
              lastMessageTime: lastMsg ? timeAgo(lastMsg.created_at) : undefined,
              lastMessageAt: lastMsg?.created_at,
              unreadCount,
              initials: otherUser?.initials ?? 'DM',
              color: '#5B7C99',
            };
          } else if (isCourse) {
            const course = courseMap.get(entityId);
            return {
              channelId: ch.id,
              name: course ? `${course.code} - ${course.name}` : 'Course Chat',
              type: 'course' as const,
              entityId,
              lastMessage: lastMsg?.body,
              lastMessageTime: lastMsg ? timeAgo(lastMsg.created_at) : undefined,
              lastMessageAt: lastMsg?.created_at,
              unreadCount,
              initials: course?.code?.substring(0, 2) ?? 'CC',
              color: course?.color ?? '#2F6B45',
            };
          } else {
            const pod = podMap.get(entityId);
            return {
              channelId: ch.id,
              name: pod?.name ?? 'Pod Chat',
              type: 'pod' as const,
              entityId,
              lastMessage: lastMsg?.body,
              lastMessageTime: lastMsg ? timeAgo(lastMsg.created_at) : undefined,
              lastMessageAt: lastMsg?.created_at,
              unreadCount,
              initials: pod?.name?.substring(0, 2)?.toUpperCase() ?? 'PC',
              color: '#2F6B45',
            };
          }
        }),
      );

      if (!cancelled) {
        conversations.sort((a, b) => {
          if (!a.lastMessageAt && !b.lastMessageAt) return 0;
          if (!a.lastMessageAt) return 1;
          if (!b.lastMessageAt) return -1;
          return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
        });
        setData(conversations);
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [currentUser.id, tick]);

  const totalUnread = useMemo(() => data.reduce((s, c) => s + c.unreadCount, 0), [data]);

  return { data, loading, totalUnread, refetch };
}

// ────────────────────────────────────────────────────────────
// MARK CHANNEL AS READ
// ────────────────────────────────────────────────────────────

export function useMarkChannelRead() {
  const { currentUser } = useDemoUser();

  return useCallback(
    async (channelId: string) => {
      await supabase
        .from('channel_reads')
        .upsert(
          { profile_id: currentUser.id, channel_id: channelId, last_read_at: new Date().toISOString() },
          { onConflict: 'profile_id,channel_id' },
        );
    },
    [currentUser.id],
  );
}

// ────────────────────────────────────────────────────────────
// DIRECT MESSAGES (1-on-1)
// ────────────────────────────────────────────────────────────

export function useStartDM() {
  const { currentUser } = useDemoUser();

  return useCallback(
    async (otherUserId: string): Promise<string> => {
      // Check if a DM channel already exists between these two users
      // Query channels where current user is user1 OR user2, then filter for the other participant
      const { data: existing } = await supabase
        .from('channels')
        .select('id, user1_id, user2_id')
        .eq('is_direct', true)
        .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`)
        .limit(50);

      // Filter to find the channel where both users are participants
      const match = (existing ?? []).find(
        (ch: any) =>
          (ch.user1_id === currentUser.id && ch.user2_id === otherUserId) ||
          (ch.user1_id === otherUserId && ch.user2_id === currentUser.id),
      );

      if (match) return match.id;

      // Create a new DM channel
      const { data: newCh, error } = await supabase
        .from('channels')
        .insert({
          is_direct: true,
          user1_id: currentUser.id,
          user2_id: otherUserId,
          name: 'dm',
        })
        .select('id')
        .single();

      if (error || !newCh) throw error ?? new Error('Failed to create DM');
      return newCh.id;
    },
    [currentUser.id],
  );
}

export function useDMMessages(channelId: string): {
  data: Message[];
  loading: boolean;
  refetch: () => void;
  sendMessage: (text: string) => Promise<void>;
} {
  const { currentUser } = useDemoUser();
  const [data, setData] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;
    setLoading(true);

    (async () => {
      const { data: msgs } = await supabase
        .from('messages')
        .select('*, profiles!messages_author_id_fkey(name, initials)')
        .eq('channel_id', channelId)
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

      if (!cancelled) {
        realtimeChannel = supabase
          .channel(`dm-${channelId}`)
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'messages', filter: `channel_id=eq.${channelId}` },
            async (payload) => {
              const newRow = payload.new as any;
              const { data: msgFull } = await supabase
                .from('messages')
                .select('*, profiles!messages_author_id_fkey(name, initials)')
                .eq('id', newRow.id)
                .single();
              if (!msgFull) return;
              const newMessage: Message = {
                id: msgFull.id,
                authorName: msgFull.profiles?.name ?? 'Unknown',
                authorInitials: msgFull.profiles?.initials ?? '?',
                text: msgFull.body,
                timestamp: formatTime(msgFull.created_at),
                isStudyRequest: msgFull.is_study_request,
                studyRequestId: msgFull.study_request_id,
                isOwn: msgFull.author_id === currentUser.id,
              };
              setData((prev) => (prev.some((m) => m.id === newMessage.id) ? prev : [...prev, newMessage]));
            },
          )
          .subscribe();
      }
    })();

    return () => {
      cancelled = true;
      if (realtimeChannel) supabase.removeChannel(realtimeChannel);
    };
  }, [channelId, currentUser.id, tick]);

  const sendMessage = useCallback(
    async (text: string) => {
      await supabase.from('messages').insert({
        channel_id: channelId,
        author_id: currentUser.id,
        body: text,
        is_study_request: false,
      });
    },
    [channelId, currentUser.id],
  );

  return { data, loading, refetch, sendMessage };
}

// ────────────────────────────────────────────────────────────
// USER AVAILABILITY (for viewing someone's schedule)
// ────────────────────────────────────────────────────────────

export interface AvailabilityBlock {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

export function useUserAvailability(profileId: string): {
  data: AvailabilityBlock[];
  loading: boolean;
} {
  const [data, setData] = useState<AvailabilityBlock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      const { data: blocks } = await supabase
        .from('availability_blocks')
        .select('id, day_of_week, start_time, end_time')
        .eq('profile_id', profileId)
        .order('day_of_week', { ascending: true });

      if (cancelled) return;

      const enriched: AvailabilityBlock[] = (blocks ?? []).map((b: any) => ({
        id: b.id,
        dayOfWeek: b.day_of_week,
        startTime: b.start_time,
        endTime: b.end_time,
      }));

      if (!cancelled) {
        setData(enriched);
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [profileId]);

  return { data, loading };
}

// ────────────────────────────────────────────────────────────
// TODAY'S SCHEDULE
// ────────────────────────────────────────────────────────────

export interface ScheduleItem {
  id: string;
  type: 'availability' | 'task';
  title: string;
  day: string;
  startTime?: string;
  endTime?: string;
  courseCode?: string;
}

export function useTodaySchedule(): {
  data: ScheduleItem[];
  loading: boolean;
} {
  const { currentUser } = useDemoUser();
  const [data, setData] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

      // Get availability blocks for today
      const { data: blocks } = await supabase
        .from('availability_blocks')
        .select('id, day_of_week, start_time, end_time')
        .eq('profile_id', currentUser.id)
        .eq('day_of_week', todayName)
        .order('start_time', { ascending: true });

      // Get incomplete solo tasks
      const { data: tasks } = await supabase
        .from('task_completions')
        .select('id, text, course_id, completed, courses!task_completions_course_id_fkey(code)')
        .eq('profile_id', currentUser.id)
        .eq('completed', false)
        .order('sort_order', { ascending: true });

      if (cancelled) return;

      const items: ScheduleItem[] = [];

      (blocks ?? []).forEach((b: any) => {
        items.push({
          id: `avail-${b.id}`,
          type: 'availability',
          title: 'Free to study',
          day: b.day_of_week,
          startTime: b.start_time,
          endTime: b.end_time,
        });
      });

      (tasks ?? []).forEach((t: any) => {
        items.push({
          id: `task-${t.id}`,
          type: 'task',
          title: t.text,
          day: todayName,
          courseCode: t.courses?.code,
        });
      });

      // Sort: availability blocks by start time, then tasks
      items.sort((a, b) => {
        if (a.type === 'availability' && b.type === 'availability') {
          return (a.startTime ?? '').localeCompare(b.startTime ?? '');
        }
        if (a.type === 'availability') return -1;
        if (b.type === 'availability') return 1;
        return 0;
      });

      if (!cancelled) {
        setData(items);
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [currentUser.id]);

  return { data, loading };
}
