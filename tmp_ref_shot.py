from playwright.sync_api import sync_playwright
url="https://fouzan7.github.io/Fouzan7-github.io/"
with sync_playwright() as pw:
    b=pw.chromium.launch()
    ctx=b.new_context(viewport={"width":1440,"height":1000}, color_scheme="dark")
    p=ctx.new_page(); errs=[]
    p.on("pageerror", lambda e: errs.append(str(e)))
    p.goto(url, wait_until="networkidle"); p.wait_for_timeout(1800)
    p.screenshot(path="tmp_ref_desktop.png", full_page=False)
    p.screenshot(path="tmp_ref_full.png", full_page=True)
    print("title:", p.title())
    print("h1:", p.locator("h1").all_inner_texts())
    print("h2:", p.locator("h2").all_inner_texts())
    print("text:", p.locator("body").inner_text()[:2500])
    print("errors:", errs)
    ctx.close()
    ctx=b.new_context(viewport={"width":390,"height":844}, is_mobile=True, has_touch=True, color_scheme="dark")
    p=ctx.new_page(); p.goto(url, wait_until="networkidle"); p.wait_for_timeout(1200)
    p.screenshot(path="tmp_ref_mobile.png", full_page=False)
    print("mobile sw:", p.evaluate("document.documentElement.scrollWidth"), "iw:", p.evaluate("innerWidth"))
    b.close()
