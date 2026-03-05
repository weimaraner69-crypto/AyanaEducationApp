/**
 * 年齢・学年自動判定ロジック（日本の学校制度準拠）
 * 誕生日から現在の学年と学校段階を計算する
 *
 * @param {string} birthDateStr - 誕生日（YYYY-MM-DD 形式）
 * @param {Date} referenceDate - 基準日（デフォルト: 本日）
 * @returns {object} { age, gradeLabel, stage, isAdult }
 */
export const calculateStudentInfo = (birthDateStr, referenceDate) => {
    const birthDate = new Date(birthDateStr);
    let age = referenceDate.getFullYear() - birthDate.getFullYear();
    const m = referenceDate.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && referenceDate.getDate() < birthDate.getDate())) age--;
    const birthYear = birthDate.getFullYear();
    const birthMonth = birthDate.getMonth() + 1;
    const birthDay = birthDate.getDate();
    let startYear = (birthMonth < 4 || (birthMonth === 4 && birthDay === 1)) ? birthYear + 6 : birthYear + 7;
    const currentSchoolYear = referenceDate.getMonth() < 3 ? referenceDate.getFullYear() - 1 : referenceDate.getFullYear();
    const diff = currentSchoolYear - startYear + 1;
    let gradeLabel = "";
    let stage = "es";
    if (diff >= 1 && diff <= 6) { gradeLabel = `小学校 ${diff}年生`; stage = "es"; }
    else if (diff >= 7 && diff <= 9) { gradeLabel = `中学校 ${diff - 6}年生`; stage = "jhs"; }
    else if (diff >= 10 && diff <= 12) { gradeLabel = `高校 ${diff - 9}年生`; stage = "hs"; }
    else { gradeLabel = diff > 12 ? "卒業生" : "未就学"; stage = diff > 12 ? "hs" : "es"; }
    // 20歳での権限移譲準備
    const isAdult = age >= 20;
    return { age, gradeLabel, stage, isAdult };
};
