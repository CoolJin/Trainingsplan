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

// Helper to merge local storage data if DB fails
function getLocalRoutine() {
    if (typeof window !== 'undefined') {
        const local = localStorage.getItem('workout_routine');
        return local ? JSON.parse(local) : null;
    }
    return null;
}

export async function getUserProfile() {
    const userId = await getCurrentUserId();
    let profile = null;

    if (userId) {
        const { data } = await supabase
            .from('user_plans')
            .select('*')
            .eq('user_id', userId)
            .single();
        profile = data;
    }

    // Fallback/Merge with LocalStorage
    const localRoutine = getLocalRoutine();
    if (localRoutine) {
        if (!profile) profile = {};
        // Use local routine if cloud one is missing
        if (!profile.workout_routine) {
            profile.workout_routine = localRoutine;
            // Also ensure basic fields exist if profile was null
            if (!profile.age) profile.age = 25; // Default fallback to prevent crash
        }
    }

    return profile;
}

export async function saveOnboardingData(data: OnboardingData) {
    if (typeof window !== 'undefined') {
        localStorage.setItem('user_profile_local', JSON.stringify(data));
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return { success: true };

    const userId = await getCurrentUserId();
    if (!userId) return { success: true }; // Just local save if not logged in

    try {
        const { data: inserted, error } = await supabase
            .from('user_plans')
            .upsert([{
                user_id: userId,
                units: data.units,
                gender: data.gender,
                age: parseInt(data.age) || 0,
                weight: parseFloat(data.weight) || 0,
                height: parseFloat(data.height) || 0,
                goal: data.goal
            }], { onConflict: 'user_id' })
            .select();

        if (error) {
            console.warn('Supabase save failed, using local only:', error);
            return { success: true, warning: 'Saved locally only' };
        }
        return { success: true, data: inserted };
    } catch (e) {
        return { success: false, error: e };
    }
}

export async function saveUserPlan(planId: string) {
    const userId = await getCurrentUserId();

    if (!userId) {
        return { success: false, error: 'Not authenticated' };
    }

    try {
        const { error } = await supabase.from('user_plans').upsert({ user_id: userId, selected_plan: planId }, { onConflict: 'user_id' });

        if (error) {
            console.error("Supabase Error saving plan:", error);
            return { success: false, error };
        }

        return { success: true };
    } catch (e) {
        return { success: false, error: e };
    }
}

export async function saveWorkoutRoutine(routine: any) {
    // 1. Always save to LocalStorage (Instant & Reliable)
    if (typeof window !== 'undefined') {
        localStorage.setItem('workout_routine', JSON.stringify(routine));
        console.log("Saved routine to LocalStorage");
    }

    const userId = await getCurrentUserId();
    if (!userId) return { success: true }; // Anonymous user is okay with LocalStorage

    // 2. Try Supabase (Best Effort)
    try {
        const { error } = await supabase
            .from('user_plans')
            .upsert({
                user_id: userId,
                workout_routine: routine,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });

        if (error) {
            console.warn("Cloud save failed (likely schema mismatch), but LocalStorage saved.", error);
            // Return success because we saved locally!
            return { success: true, warning: "Saved locally only" };
        }
        return { success: true };
    } catch (e) {
        console.warn("Cloud save error:", e);
        return { success: true }; // Fallback success
    }
}

// Helper to delete plan
export async function deleteUserPlan() {
    // 1. Clear LocalStorage
    if (typeof window !== 'undefined') {
        localStorage.removeItem('workout_routine');
    }

    const userId = await getCurrentUserId();
    if (!userId) return { success: true };

    try {
        const { error } = await supabase
            .from('user_plans')
            .update({ workout_routine: null })
            .eq('user_id', userId);

        if (error) {
            console.error("Error deleting plan:", error);
            return { success: false, error };
        }
        return { success: true };
    } catch (e) {
        return { success: false, error: e };
    }
}
