import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/config/env";

// Untyped on purpose for now -- our hand-written Database interface
// (src/types/database.ts) doesn't match the shape @supabase/supabase-js
// expects for its generic (it also wants Views/Functions/Enums/
// CompositeTypes). Once the project is provisioned, replace this with
// real generated types: `supabase gen types typescript --linked`.
// App code uses the domain types from src/types/database.ts via casts
// at the query boundary instead.
export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
