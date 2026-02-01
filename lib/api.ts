import { supabase } from './supabase'

export interface OnboardingData {
    units: string;
    gender: string;
    age: string;
    weight: string;
    height: string;
    goal: string;
}

// Helper to get current user
async function getCurrentUserId() {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id;
}

export async function getUserProfile() {
    const userId = await getCurrentUserId();
    if (!userId) return null;

    // Check 'user_plans' (or whatever table we use for onboarding data)
    // Assuming 'onboarding_data' or mapped to 'user_plans' as per previous code.
    const { data } = await supabase
        .from('user_plans')
        .select('*')
        .eq('user_id', userId) // Assuming user_id column exists
        .single();

    return data;
}

export async function saveOnboardingData(data: OnboardingData) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        // Mock
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { success: true, warning: 'Supabase credentials missing' };
    }

    const userId = await getCurrentUserId();
    if (!userId) {
        return { success: false, error: 'Not authenticated' };
    }

    try {
        // Upsert based on user_id
        const { data: inserted, error } = await supabase
            .from('user_plans')
            .upsert([
                {
                    user_id: userId, // Ensure we save against the user
                    units: data.units,
                    gender: data.gender,
                    age: parseInt(data.age) || 0,
                    weight: parseFloat(data.weight) || 0,
                    height: parseFloat(data.height) || 0,
                    goal: data.goal,
                    // updated_at: new Date() // If column exists
                }
            ], { onConflict: 'user_id' })
            .select();

        if (error) {
            console.error('Supabase error:', error);
            return { success: false, error };
        }

        return { success: true, data: inserted };
    } catch (e) {
        console.error('Unexpected error:', e);
        return { success: false, error: e };
    }
}

export async function saveUserPlan(planId: string) {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: 'Not authenticated' };

    // Save plan selection. Could be in 'subscriptions' table or 'user_plans'
    // Let's assume 'user_plans' has a 'plan_id' column for now, or create a new table?
    // User didn't specify schema. "Simply save user plan".
    // I'll update 'user_plans' with 'selected_plan'

    try {
        const { error } = await supabase
            .from('user_plans')
            .upsert({
                user_id: userId,
                selected_plan: planId
            }, { onConflict: 'user_id' }); // Merge update

        if (error) throw error;
        return { success: true };
    } catch (e) {
        console.error("Error saving plan:", e);
        return { success: false, error: e };
    }
}
