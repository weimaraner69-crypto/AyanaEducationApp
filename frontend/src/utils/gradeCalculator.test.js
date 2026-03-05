import { calculateStudentInfo } from './gradeCalculator';

/**
 * テストの再現性確保のため基準日を固定（NFR-001）
 * 2026年4月15日（新年度開始後）を標準基準日とする
 */
const REF_DATE = new Date('2026-04-15');

describe('calculateStudentInfo', () => {

  // ----------------------------------------------------------------
  // AC-071: 年齢計算の精度（誕生日当日と前日の挙動）
  // ----------------------------------------------------------------
  describe('年齢計算（AC-071）', () => {
    it('誕生日当日に年齢が加算される', () => {
      // 2006-04-15生まれ、基準日2026-04-15 → 満20歳当日
      const result = calculateStudentInfo('2006-04-15', REF_DATE);
      expect(result.age).toBe(20);
    });

    it('誕生日前日はまだ年齢が加算されない', () => {
      // 2006-04-16生まれ、基準日2026-04-15 → 翌日に20歳になる（19歳）
      const result = calculateStudentInfo('2006-04-16', REF_DATE);
      expect(result.age).toBe(19);
    });

    it('誕生日翌日以降は年齢が加算済み', () => {
      // 2006-04-14生まれ、基準日2026-04-15 → 昨日20歳になった
      const result = calculateStudentInfo('2006-04-14', REF_DATE);
      expect(result.age).toBe(20);
    });

    it('誕生月が基準月より前の場合は計算年差がそのまま年齢', () => {
      // 2000-03-31生まれ、基準日2026-04-15 → 26歳（3月 < 4月）
      const result = calculateStudentInfo('2000-03-31', REF_DATE);
      expect(result.age).toBe(26);
    });

    it('誕生月が基準月より後の場合は計算年差から1引く', () => {
      // 2010-12-01生まれ、基準日2026-04-15 → 15歳（12月 > 4月）
      const result = calculateStudentInfo('2010-12-01', REF_DATE);
      expect(result.age).toBe(15);
    });
  });

  // ----------------------------------------------------------------
  // AC-072: 学年判定の正確性（4月1日生まれと4月2日生まれの差異）
  // ----------------------------------------------------------------
  describe('4月1日と4月2日生まれの学年差異（AC-072）', () => {
    it('4月1日生まれは前の学年にカウントされる（小学校2年生）', () => {
      // 2019-04-01生まれ → startYear = 2025, diff = 2026-2025+1 = 2
      const result = calculateStudentInfo('2019-04-01', REF_DATE);
      expect(result.gradeLabel).toBe('小学校 2年生');
      expect(result.stage).toBe('es');
    });

    it('4月2日生まれは後の学年にカウントされる（小学校1年生）', () => {
      // 2019-04-02生まれ → startYear = 2026, diff = 2026-2026+1 = 1
      const result = calculateStudentInfo('2019-04-02', REF_DATE);
      expect(result.gradeLabel).toBe('小学校 1年生');
      expect(result.stage).toBe('es');
    });

    it('3月31日生まれと4月1日生まれは同じ学年になる', () => {
      // どちらも startYear = 2025 → diff = 2（小学校2年生）
      const result1 = calculateStudentInfo('2019-03-31', REF_DATE);
      const result2 = calculateStudentInfo('2019-04-01', REF_DATE);
      expect(result1.gradeLabel).toBe(result2.gradeLabel);
    });

    it('4月1日生まれと4月2日生まれは学年が異なる', () => {
      const result1 = calculateStudentInfo('2019-04-01', REF_DATE);
      const result2 = calculateStudentInfo('2019-04-02', REF_DATE);
      expect(result1.gradeLabel).not.toBe(result2.gradeLabel);
    });
  });

  // ----------------------------------------------------------------
  // AC-070: 境界値テスト（小学校入学前後、学年境界）
  // ----------------------------------------------------------------
  describe('学校段階・学年の境界値（AC-070）', () => {

    describe('未就学 → 小学校1年生の境界', () => {
      it('4月1日生まれは入学年に小学校1年生になる', () => {
        // 2020-04-01生まれ → startYear = 2026, diff = 2026-2026+1 = 1
        const result = calculateStudentInfo('2020-04-01', REF_DATE);
        expect(result.gradeLabel).toBe('小学校 1年生');
        expect(result.stage).toBe('es');
      });

      it('4月2日生まれは同年度は未就学のまま', () => {
        // 2020-04-02生まれ → startYear = 2027, diff = 2026-2027+1 = 0
        const result = calculateStudentInfo('2020-04-02', REF_DATE);
        expect(result.gradeLabel).toBe('未就学');
        expect(result.stage).toBe('es');
      });
    });

    describe('小学校6年生 → 中学校1年生の境界', () => {
      it('diff=6（4月2日生まれ）は小学校6年生', () => {
        // 2014-04-02生まれ → startYear = 2021, diff = 2026-2021+1 = 6
        const result = calculateStudentInfo('2014-04-02', REF_DATE);
        expect(result.gradeLabel).toBe('小学校 6年生');
        expect(result.stage).toBe('es');
      });

      it('diff=7（4月1日生まれ）は中学校1年生', () => {
        // 2014-04-01生まれ → startYear = 2020, diff = 2026-2020+1 = 7
        const result = calculateStudentInfo('2014-04-01', REF_DATE);
        expect(result.gradeLabel).toBe('中学校 1年生');
        expect(result.stage).toBe('jhs');
      });
    });

    describe('中学校3年生 → 高校1年生の境界', () => {
      it('diff=9（4月2日生まれ）は中学校3年生', () => {
        // 2011-04-02生まれ → startYear = 2018, diff = 2026-2018+1 = 9
        const result = calculateStudentInfo('2011-04-02', REF_DATE);
        expect(result.gradeLabel).toBe('中学校 3年生');
        expect(result.stage).toBe('jhs');
      });

      it('diff=10（4月1日生まれ）は高校1年生', () => {
        // 2011-04-01生まれ → startYear = 2017, diff = 2026-2017+1 = 10
        const result = calculateStudentInfo('2011-04-01', REF_DATE);
        expect(result.gradeLabel).toBe('高校 1年生');
        expect(result.stage).toBe('hs');
      });
    });

    describe('高校3年生 → 卒業生の境界', () => {
      it('diff=12（4月2日生まれ）は高校3年生', () => {
        // 2008-04-02生まれ → startYear = 2015, diff = 2026-2015+1 = 12
        const result = calculateStudentInfo('2008-04-02', REF_DATE);
        expect(result.gradeLabel).toBe('高校 3年生');
        expect(result.stage).toBe('hs');
      });

      it('diff=13（4月1日生まれ）は卒業生', () => {
        // 2008-04-01生まれ → startYear = 2014, diff = 2026-2014+1 = 13
        const result = calculateStudentInfo('2008-04-01', REF_DATE);
        expect(result.gradeLabel).toBe('卒業生');
        expect(result.stage).toBe('hs');
      });
    });

    describe('各学校段階の中間学年', () => {
      it('小学校3年生（diff=3）', () => {
        // 2018-04-02生まれ → startYear = 2025, diff = 2026-2025+1 = 2... 待って
        // 2018-04-02生まれ → startYear = 2025, diff = 2026-2025+1 = 2 → 小学校2年生
        // ではなく 2017-04-02生まれ → startYear = 2024, diff = 2026-2024+1 = 3
        const result = calculateStudentInfo('2017-04-02', REF_DATE);
        expect(result.gradeLabel).toBe('小学校 3年生');
        expect(result.stage).toBe('es');
      });

      it('中学校2年生（diff=8）', () => {
        // 2012-04-02生まれ → startYear = 2019, diff = 2026-2019+1 = 8
        const result = calculateStudentInfo('2012-04-02', REF_DATE);
        expect(result.gradeLabel).toBe('中学校 2年生');
        expect(result.stage).toBe('jhs');
      });

      it('高校2年生（diff=11）', () => {
        // 2009-04-02生まれ → startYear = 2016, diff = 2026-2016+1 = 11
        const result = calculateStudentInfo('2009-04-02', REF_DATE);
        expect(result.gradeLabel).toBe('高校 2年生');
        expect(result.stage).toBe('hs');
      });
    });
  });

  // ----------------------------------------------------------------
  // AC-073: isAdult フラグの正確性（満20歳境界）
  // ----------------------------------------------------------------
  describe('isAdult フラグ（AC-073）', () => {
    it('満20歳の誕生日当日に isAdult が true になる', () => {
      // 2006-04-15生まれ、基準日2026-04-15 → 満20歳当日
      const result = calculateStudentInfo('2006-04-15', REF_DATE);
      expect(result.isAdult).toBe(true);
      expect(result.age).toBe(20);
    });

    it('満20歳の誕生日前日は isAdult が false のまま', () => {
      // 2006-04-16生まれ、基準日2026-04-15 → まだ19歳
      const result = calculateStudentInfo('2006-04-16', REF_DATE);
      expect(result.isAdult).toBe(false);
      expect(result.age).toBe(19);
    });

    it('満20歳の誕生日翌日以降も isAdult が true', () => {
      // 2006-04-14生まれ、基準日2026-04-15 → 昨日20歳になった
      const result = calculateStudentInfo('2006-04-14', REF_DATE);
      expect(result.isAdult).toBe(true);
    });

    it('19歳（20歳の1年前）は isAdult が false', () => {
      // 2007-04-15生まれ、基準日2026-04-15 → 19歳
      const result = calculateStudentInfo('2007-04-15', REF_DATE);
      expect(result.isAdult).toBe(false);
      expect(result.age).toBe(19);
    });

    it('21歳以上も isAdult が true', () => {
      // 2005-04-15生まれ、基準日2026-04-15 → 21歳
      const result = calculateStudentInfo('2005-04-15', REF_DATE);
      expect(result.isAdult).toBe(true);
      expect(result.age).toBe(21);
    });
  });

  // ----------------------------------------------------------------
  // 学校年度境界（1〜3月は前年度扱い）
  // ----------------------------------------------------------------
  describe('学校年度の境界（1〜3月は前年度扱い）', () => {
    it('1月基準日では前年度として計算される', () => {
      // referenceDate = 2026-01-15 → currentSchoolYear = 2025
      // 2019-04-01生まれ → startYear = 2025, diff = 2025-2025+1 = 1 → 小学校1年生
      const refJan = new Date('2026-01-15');
      const result = calculateStudentInfo('2019-04-01', refJan);
      expect(result.gradeLabel).toBe('小学校 1年生');
    });

    it('3月31日基準日では前年度として計算される', () => {
      // referenceDate = 2026-03-31 → currentSchoolYear = 2025
      // 2020-04-01生まれ → startYear = 2026, diff = 2025-2026+1 = 0 → 未就学
      const refMar = new Date('2026-03-31');
      const result = calculateStudentInfo('2020-04-01', refMar);
      expect(result.gradeLabel).toBe('未就学');
    });

    it('4月1日基準日では新年度として計算される', () => {
      // referenceDate = 2026-04-01 → currentSchoolYear = 2026
      // 2020-04-01生まれ → startYear = 2026, diff = 2026-2026+1 = 1 → 小学校1年生
      const refApr1 = new Date('2026-04-01');
      const result = calculateStudentInfo('2020-04-01', refApr1);
      expect(result.gradeLabel).toBe('小学校 1年生');
    });
  });

  // ----------------------------------------------------------------
  // 返り値の構造検証
  // ----------------------------------------------------------------
  describe('返り値の構造', () => {
    it('age, gradeLabel, stage, isAdult の 4 プロパティを持つオブジェクトを返す', () => {
      const result = calculateStudentInfo('2014-04-01', REF_DATE);
      expect(result).toHaveProperty('age');
      expect(result).toHaveProperty('gradeLabel');
      expect(result).toHaveProperty('stage');
      expect(result).toHaveProperty('isAdult');
    });

    it('age は数値型', () => {
      const result = calculateStudentInfo('2010-06-01', REF_DATE);
      expect(typeof result.age).toBe('number');
    });

    it('isAdult は真偽値型', () => {
      const result = calculateStudentInfo('2010-06-01', REF_DATE);
      expect(typeof result.isAdult).toBe('boolean');
    });
  });
});
