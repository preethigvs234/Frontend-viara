import { supabase } from "./supabaseClient";
import { useEffect } from "react";

function TestSupabaseConnection() {
  useEffect(() => {
    async function testConnection() {
      const { data, error } = await supabase.from("users").select("*");
      if (error) {
        console.error("Supabase error:", error.message);
      } else {
        console.log("Supabase data:", data);
      }
    }
    testConnection();
  }, []);

  return <div>Supabase Connection Test</div>;
}

export default TestSupabaseConnection;