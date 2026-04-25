// Único arquivo do frontend autorizado a importar o client Supabase cru.
// Tudo o mais consome a fachada em "@/lib/auth".
export { supabase } from "@/integrations/supabase/client";
