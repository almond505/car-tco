export default function App() {
  return (
    <main>
      <nav aria-label="เมนูหลัก">
        <a href="#calculator">ต้นทุนรถของคุณ</a>
      </nav>
      <header>
        <h1>รถคันต่อไป ควรคุ้มตั้งแต่วันแรก</h1>
        <p>เปรียบเทียบต้นทุนจริง ภาระรายเดือน และจุดคุ้มทุนจากข้อมูลของคุณ</p>
        <a href="#calculator">เริ่มคำนวณ</a>
      </header>
      <section id="calculator" aria-labelledby="calculator-title">
        <h2 id="calculator-title">เริ่มจากข้อมูลของคุณ</h2>
      </section>
    </main>
  );
}
