
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkTitles() {
  // Fetch all tests
  const { data: tests } = await supabase.from('tests').select('title');
  console.log('--- TESTS ---');
  console.log(tests?.map(t => t.title));

  // Fetch all materials
  const { data: materials } = await supabase.from('materials').select('title');
  console.log('--- MATERIALS ---');
  console.log(materials?.map(m => m.title));

  // Fetch all schedules
  const { data: schedules } = await supabase.from('schedules').select('title, type');
  console.log('--- SCHEDULES ---');
  console.log(schedules?.map(s => `[${s.type}] ${s.title}`));
}

checkTitles();
