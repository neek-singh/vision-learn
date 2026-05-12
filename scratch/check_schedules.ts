import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchedules() {
  const { data: lessons } = await supabase.from('lessons').select('id, title, module_id');
  const { data: modules } = await supabase.from('lms_modules').select('id, title');
  const { data: schedules } = await supabase.from('schedules').select('id, title, date, start_time');

  console.log('--- Modules ---');
  modules?.forEach(m => console.log(`${m.id}: ${m.title}`));

  console.log('\n--- Lessons ---');
  lessons?.forEach(l => {
    const m = modules?.find(mod => mod.id === l.module_id);
    console.log(`${l.id}: [${m?.title}] ${l.title}`);
  });

  console.log('\n--- Schedules ---');
  schedules?.forEach(s => console.log(`${s.id}: ${s.title} (${s.date} ${s.start_time})`));
}

checkSchedules();
