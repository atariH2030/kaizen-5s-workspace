(function initGamification() {
  async function resolveUserId(supabaseClient) {
    const globalUserId = window.AUTH_USER_ID || window.__AUTH_USER_ID__ || sessionStorage.getItem("kaizen_user_id") || null;
    if (globalUserId) {
      return globalUserId;
    }

    if (!supabaseClient) {
      return null;
    }

    const { data, error } = await supabaseClient.auth.getSession();
    if (error) {
      return null;
    }

    const userId = data?.session?.user?.id || null;
    if (!userId) {
      return null;
    }

    sessionStorage.setItem("kaizen_user_id", userId);
    window.AUTH_USER_ID = userId;
    window.__AUTH_USER_ID__ = userId;

    return userId;
  }

  async function updateTableProgress(supabaseClient, tableName, userId, xpDelta, coinsDelta) {
    if (tableName === "profiles") {
      const { data, error } = await supabaseClient
        .from("profiles")
        .select("id, xp, coins, level")
        .eq("id", userId)
        .single();

      if (error) {
        throw error;
      }

      const currentXp = Number(data?.xp || 0);
      const currentCoins = Number(data?.coins || 0);
      const nextXp = currentXp + xpDelta;
      const nextCoins = currentCoins + coinsDelta;
      const nextLevel = Math.max(1, Math.floor(nextXp / 100) + 1);

      const { error: updateError } = await supabaseClient
        .from("profiles")
        .update({ xp: nextXp, coins: nextCoins, level: nextLevel })
        .eq("id", userId);

      if (updateError) {
        throw updateError;
      }

      return { xp: nextXp, coins: nextCoins, level: nextLevel };
    }

    const { data, error } = await supabaseClient
      .from("users")
      .select("id, experiencia_xp, moedas_kaizen, nivel")
      .eq("id", userId)
      .single();

    if (error) {
      throw error;
    }

    const currentXp = Number(data?.experiencia_xp || 0);
    const currentCoins = Number(data?.moedas_kaizen || 0);
    const nextXp = currentXp + xpDelta;
    const nextCoins = currentCoins + coinsDelta;
    const nextLevel = Math.max(1, Math.floor(nextXp / 100) + 1);

    const { error: updateError } = await supabaseClient
      .from("users")
      .update({ experiencia_xp: nextXp, moedas_kaizen: nextCoins, nivel: nextLevel })
      .eq("id", userId);

    if (updateError) {
      throw updateError;
    }

    return { xp: nextXp, coins: nextCoins, level: nextLevel };
  }

  window.awardProfileProgress = async function awardProfileProgress(options = {}) {
    const xpDelta = Number(options.xp || 0);
    const coinsDelta = Number(options.coins || 0);

    if (xpDelta === 0 && coinsDelta === 0) {
      return { ok: true, skipped: true };
    }

    const supabaseClient = window.getSupabaseClient ? window.getSupabaseClient() : null;
    if (!supabaseClient) {
      return { ok: false, reason: "Supabase não configurado" };
    }

    const userId = options.userId || (await resolveUserId(supabaseClient));
    if (!userId) {
      return { ok: false, reason: "Usuário não autenticado" };
    }

    try {
      const payload = await updateTableProgress(supabaseClient, "profiles", userId, xpDelta, coinsDelta);
      console.log("XP Recebido!", { userId, table: "profiles", xpDelta, coinsDelta, totals: payload });
      return { ok: true, table: "profiles", ...payload };
    } catch (_) {
      try {
        const payload = await updateTableProgress(supabaseClient, "users", userId, xpDelta, coinsDelta);
        console.log("XP Recebido!", { userId, table: "users", xpDelta, coinsDelta, totals: payload });
        return { ok: true, table: "users", ...payload };
      } catch (error) {
        return { ok: false, reason: error?.message || "Falha ao atualizar progresso" };
      }
    }
  };
})();
