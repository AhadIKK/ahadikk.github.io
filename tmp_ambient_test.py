from playwright.sync_api import sync_playwright
import json
with sync_playwright() as pw:
    b=pw.chromium.launch(); ctx=b.new_context(viewport={"width":1440,"height":1000}, color_scheme="dark")
    p=ctx.new_page(); errs=[]; p.on("pageerror", lambda e: errs.append(str(e)))
    p.goto("http://127.0.0.1:4173/", wait_until="networkidle"); p.wait_for_timeout(900)
    print("ambient:", p.evaluate("""() => {
      const a=document.querySelector('.ambient'); const t=document.querySelector('.ambient__orb--teal'); const s=document.querySelector('.ambient__spot');
      return {live:a.classList.contains('is-live'), teal:t.style.transform, spotOpacity:getComputedStyle(s).opacity, spotDisplay:getComputedStyle(s).display};
    }"""))
    p.mouse.move(1100,450); p.wait_for_timeout(600)
    print("ambient moved:", p.evaluate("""() => ({teal:document.querySelector('.ambient__orb--teal').style.transform, ember:document.querySelector('.ambient__orb--ember').style.transform, spot:document.querySelector('.ambient__spot').style.transform})"""))
    p.screenshot(path="tmp_ambient_home.png", full_page=False)
    # nav hover
    act=p.locator('.nav-list a[href="achievements.html"]'); box=act.bounding_box()
    p.mouse.move(box['x']+box['width']/2, box['y']+box['height']/2); p.wait_for_timeout(450)
    print("nav pill:", p.evaluate("""() => {
      const pill=document.querySelector('.cursor-pill'); const link=document.querySelector('.nav-list a[href="achievements.html"]'); const r=link.getBoundingClientRect();
      return {visible:pill.classList.contains('is-visible'), left:pill.style.left, top:pill.style.top, width:pill.style.width, height:pill.style.height, link:{left:r.left, top:r.top, width:r.width, height:r.height}, dot:document.querySelector('.cursor-dot').style.opacity, ring:document.querySelector('.cursor-ring').style.opacity};
    }"""))
    p.screenshot(path="tmp_pill_hover.png", full_page=False)
    p.mouse.move(700,700); p.wait_for_timeout(400)
    print("pill leave:", p.evaluate("""() => ({visible:document.querySelector('.cursor-pill').classList.contains('is-visible'), dot:document.querySelector('.cursor-dot').style.opacity, ring:document.querySelector('.cursor-ring').style.opacity})"""))
    print("errors:", errs)
    b.close()
