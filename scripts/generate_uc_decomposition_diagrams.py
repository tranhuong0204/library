from __future__ import annotations

import math
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable

from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_PDF = ROOT / "output" / "pdf" / "bieu-do-phan-ra-10-use-case.pdf"

FONT_REGULAR = "UCArial"
FONT_BOLD = "UCArialBold"

PAGE_WIDTH, PAGE_HEIGHT = landscape(A4)

INK = HexColor("#16324F")
MUTED = HexColor("#64748B")
LINE = HexColor("#61748B")
BOUNDARY = HexColor("#9AA9BC")
MAIN_FILL = HexColor("#DCEEFF")
MAIN_STROKE = HexColor("#2D6DB5")
INCLUDE_FILL = HexColor("#EAF8F8")
INCLUDE_STROKE = HexColor("#4A8C95")
EXTEND_FILL = HexColor("#F2EEFF")
EXTEND_STROKE = HexColor("#7565B5")
NEUTRAL_FILL = HexColor("#F5F8FC")
NEUTRAL_STROKE = HexColor("#8293A8")
WHITE = HexColor("#FFFFFF")


@dataclass(frozen=True)
class UseCaseNode:
    key: str
    label: str
    x: float
    y: float
    width: float = 158
    height: float = 48
    kind: str = "normal"


@dataclass(frozen=True)
class Actor:
    key: str
    label: str
    x: float
    y: float


@dataclass(frozen=True)
class Relation:
    source: str
    target: str
    kind: str
    condition: str | None = None
    label_offset_x: float = 0
    label_offset_y: float = 0


@dataclass(frozen=True)
class Diagram:
    section: str
    title: str
    main_key: str
    nodes: tuple[UseCaseNode, ...]
    actors: tuple[Actor, ...]
    associations: tuple[tuple[str, str], ...]
    relations: tuple[Relation, ...]
    boundary: tuple[float, float, float, float] = (122, 54, 680, 466)
    notes: tuple[str, ...] = field(default_factory=tuple)


def register_fonts() -> None:
    pdfmetrics.registerFont(TTFont(FONT_REGULAR, r"C:\Windows\Fonts\arial.ttf"))
    pdfmetrics.registerFont(TTFont(FONT_BOLD, r"C:\Windows\Fonts\arialbd.ttf"))


def wrap_text(text: str, font_name: str, font_size: float, max_width: float) -> list[str]:
    lines: list[str] = []
    for paragraph in text.split("\n"):
        words = paragraph.split()
        if not words:
            lines.append("")
            continue
        current = words[0]
        for word in words[1:]:
            candidate = f"{current} {word}"
            if pdfmetrics.stringWidth(candidate, font_name, font_size) <= max_width:
                current = candidate
            else:
                lines.append(current)
                current = word
        lines.append(current)
    return lines


def node_colors(kind: str):
    if kind == "main":
        return MAIN_FILL, MAIN_STROKE
    if kind == "include":
        return INCLUDE_FILL, INCLUDE_STROKE
    if kind == "extend":
        return EXTEND_FILL, EXTEND_STROKE
    return NEUTRAL_FILL, NEUTRAL_STROKE


def draw_use_case(c: canvas.Canvas, node: UseCaseNode) -> None:
    fill, stroke = node_colors(node.kind)
    x1 = node.x - node.width / 2
    y1 = node.y - node.height / 2
    x2 = node.x + node.width / 2
    y2 = node.y + node.height / 2

    c.saveState()
    c.setFillColor(fill)
    c.setStrokeColor(stroke)
    c.setLineWidth(1.35 if node.kind == "main" else 1.0)
    c.ellipse(x1, y1, x2, y2, fill=1, stroke=1)

    font_name = FONT_BOLD if node.kind == "main" else FONT_REGULAR
    font_size = 10.2 if node.kind == "main" else 8.8
    lines = wrap_text(node.label, font_name, font_size, node.width - 28)
    line_height = font_size + 2.2
    start_y = node.y + (len(lines) - 1) * line_height / 2 - font_size * 0.35
    c.setFont(font_name, font_size)
    c.setFillColor(INK)
    for index, line in enumerate(lines):
        c.drawCentredString(node.x, start_y - index * line_height, line)
    c.restoreState()


def draw_actor(c: canvas.Canvas, actor: Actor) -> None:
    x, y = actor.x, actor.y
    c.saveState()
    c.setStrokeColor(INK)
    c.setFillColor(INK)
    c.setLineWidth(1.5)
    c.circle(x, y + 29, 10, fill=0, stroke=1)
    c.line(x, y + 19, x, y - 15)
    c.line(x - 18, y + 6, x + 18, y + 6)
    c.line(x, y - 15, x - 17, y - 38)
    c.line(x, y - 15, x + 17, y - 38)
    c.setFont(FONT_BOLD, 8.5)
    c.drawCentredString(x, y - 54, actor.label)
    c.restoreState()


def ellipse_anchor(node: UseCaseNode, toward_x: float, toward_y: float) -> tuple[float, float]:
    dx = toward_x - node.x
    dy = toward_y - node.y
    if dx == 0 and dy == 0:
        return node.x, node.y
    rx = node.width / 2
    ry = node.height / 2
    scale = 1 / math.sqrt((dx / rx) ** 2 + (dy / ry) ** 2)
    return node.x + dx * scale, node.y + dy * scale


def draw_open_arrow(c: canvas.Canvas, start: tuple[float, float], end: tuple[float, float]) -> None:
    angle = math.atan2(end[1] - start[1], end[0] - start[0])
    size = 8
    spread = math.radians(27)
    p1 = (end[0] - size * math.cos(angle - spread), end[1] - size * math.sin(angle - spread))
    p2 = (end[0] - size * math.cos(angle + spread), end[1] - size * math.sin(angle + spread))
    c.line(end[0], end[1], p1[0], p1[1])
    c.line(end[0], end[1], p2[0], p2[1])


def draw_hollow_triangle(c: canvas.Canvas, start: tuple[float, float], end: tuple[float, float]) -> None:
    angle = math.atan2(end[1] - start[1], end[0] - start[0])
    length = 12
    half_width = 6
    base_x = end[0] - length * math.cos(angle)
    base_y = end[1] - length * math.sin(angle)
    perp_x = -math.sin(angle)
    perp_y = math.cos(angle)
    path = c.beginPath()
    path.moveTo(end[0], end[1])
    path.lineTo(base_x + half_width * perp_x, base_y + half_width * perp_y)
    path.lineTo(base_x - half_width * perp_x, base_y - half_width * perp_y)
    path.close()
    c.setFillColor(WHITE)
    c.drawPath(path, fill=1, stroke=1)


def relation_geometry(source: UseCaseNode, target: UseCaseNode):
    start = ellipse_anchor(source, target.x, target.y)
    end = ellipse_anchor(target, source.x, source.y)
    return start, end


def draw_relation_line(c: canvas.Canvas, source: UseCaseNode, target: UseCaseNode, kind: str) -> None:
    start, end = relation_geometry(source, target)
    c.saveState()
    c.setStrokeColor(LINE)
    c.setLineWidth(0.9)
    if kind in {"include", "extend"}:
        c.setDash(5, 4)
    c.line(start[0], start[1], end[0], end[1])
    if kind in {"include", "extend"}:
        draw_open_arrow(c, start, end)
    elif kind == "generalization":
        draw_hollow_triangle(c, start, end)
    c.restoreState()


def draw_association(c: canvas.Canvas, actor: Actor, target: UseCaseNode) -> None:
    actor_start_x = actor.x + 18 if actor.x < target.x else actor.x - 18
    start = (actor_start_x, actor.y + 3)
    end = ellipse_anchor(target, actor.x, actor.y)
    c.saveState()
    c.setStrokeColor(INK)
    c.setLineWidth(1.05)
    c.line(start[0], start[1], end[0], end[1])
    c.restoreState()


def draw_relation_label(c: canvas.Canvas, relation: Relation, source: UseCaseNode, target: UseCaseNode) -> None:
    if relation.kind not in {"include", "extend"}:
        return
    start, end = relation_geometry(source, target)
    t = 0.52
    x = start[0] + (end[0] - start[0]) * t + relation.label_offset_x
    y = start[1] + (end[1] - start[1]) * t + relation.label_offset_y
    label = f"<<{relation.kind}>>"
    label_width = pdfmetrics.stringWidth(label, FONT_BOLD, 7.4)
    condition_width = 0
    if relation.condition:
        condition_width = pdfmetrics.stringWidth(f"[{relation.condition}]", FONT_REGULAR, 6.3)
    box_width = max(label_width, condition_width) + 8
    box_height = 13 if relation.condition is None else 22

    c.saveState()
    c.setFillColor(WHITE)
    c.roundRect(x - box_width / 2, y - box_height / 2, box_width, box_height, 3, fill=1, stroke=0)
    c.setFillColor(INK)
    c.setFont(FONT_BOLD, 7.4)
    c.drawCentredString(x, y + (2 if relation.condition is None else 4), label)
    if relation.condition:
        c.setFillColor(MUTED)
        c.setFont(FONT_REGULAR, 6.3)
        c.drawCentredString(x, y - 6, f"[{relation.condition}]")
    c.restoreState()


def draw_page(c: canvas.Canvas, diagram: Diagram, page_number: int) -> None:
    c.setFillColor(WHITE)
    c.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)

    c.setFillColor(INK)
    c.setFont(FONT_BOLD, 15.5)
    c.drawString(34, PAGE_HEIGHT - 34, f"Biểu đồ phân rã UC {diagram.section} - {diagram.title}")
    c.setFillColor(MUTED)
    c.setFont(FONT_REGULAR, 7.7)
    c.drawRightString(PAGE_WIDTH - 34, PAGE_HEIGHT - 31, "Library AI - Mô hình use case")

    bx, by, bw, bh = diagram.boundary
    c.setStrokeColor(BOUNDARY)
    c.setLineWidth(1.0)
    c.roundRect(bx, by, bw, bh, 8, fill=0, stroke=1)
    c.setFillColor(MUTED)
    c.setFont(FONT_BOLD, 7.4)
    c.drawString(bx + 12, by + bh - 16, "HỆ THỐNG LIBRARY AI")

    nodes = {node.key: node for node in diagram.nodes}
    actors = {actor.key: actor for actor in diagram.actors}

    for relation in diagram.relations:
        draw_relation_line(c, nodes[relation.source], nodes[relation.target], relation.kind)

    for actor_key, node_key in diagram.associations:
        draw_association(c, actors[actor_key], nodes[node_key])

    for node in diagram.nodes:
        draw_use_case(c, node)
    for actor in diagram.actors:
        draw_actor(c, actor)

    for relation in diagram.relations:
        draw_relation_label(c, relation, nodes[relation.source], nodes[relation.target])

    c.setFillColor(MUTED)
    c.setFont(FONT_REGULAR, 7.1)
    legend = "Quy ước: <<include>> hướng tới UC bắt buộc; <<extend>> hướng tới UC cơ sở; tam giác rỗng biểu thị khái quát hóa."
    c.drawString(34, 26, legend)
    if diagram.notes:
        c.drawRightString(PAGE_WIDTH - 34, 26, " | ".join(diagram.notes))
    c.setFont(FONT_BOLD, 7.2)
    c.drawRightString(PAGE_WIDTH - 34, 13, f"{page_number}/10")
    c.showPage()


def n(key: str, label: str, x: float, y: float, kind: str = "normal", width: float = 158, height: float = 48):
    return UseCaseNode(key, label, x, y, width, height, kind)


def r(source: str, target: str, kind: str, condition: str | None = None, dx: float = 0, dy: float = 0):
    return Relation(source, target, kind, condition, dx, dy)


DIAGRAMS: tuple[Diagram, ...] = (
    Diagram(
        section="1.4.3.1",
        title="Đăng nhập",
        main_key="login",
        nodes=(
            n("login", "Đăng nhập", 282, 292, "main", 164, 64),
            n("input", "Nhập username/email\nvà mật khẩu", 585, 455, "include"),
            n("auth", "Xác thực tài khoản", 585, 367, "include"),
            n("status", "Kiểm tra trạng thái\ntài khoản", 585, 279, "include"),
            n("session", "Tạo JWT và\nthiết lập phiên", 585, 191, "include"),
            n("forgot", "Quên mật khẩu", 585, 103, "extend"),
        ),
        actors=(Actor("user", "Người dùng", 62, 292),),
        associations=(("user", "login"),),
        relations=(
            r("login", "input", "include", dx=2, dy=8),
            r("login", "auth", "include", dx=0, dy=5),
            r("login", "status", "include", dx=0, dy=6),
            r("login", "session", "include", dx=0, dy=-6),
            r("forgot", "login", "extend", dx=0, dy=-8),
        ),
    ),
    Diagram(
        section="1.4.3.2",
        title="Quản lý bài viết",
        main_key="posts",
        nodes=(
            n("posts", "Quản lý bài viết", 275, 292, "main", 168, 64),
            n("list", "Xem danh sách bài viết", 475, 449, "include"),
            n("detail", "Xem chi tiết bài viết", 475, 359, "extend"),
            n("create", "Tạo bài viết", 475, 269, "extend"),
            n("edit", "Sửa bài viết", 475, 179, "extend"),
            n("delete", "Xóa bài viết", 475, 89, "extend"),
            n("filter", "Lọc theo chủ đề", 680, 449, "extend", 146),
            n("comment", "Bình luận bài viết", 680, 359, "extend", 146),
            n("like", "Thích / bỏ thích", 680, 269, "extend", 146),
            n("report", "Báo cáo bài viết", 680, 179, "extend", 146),
        ),
        actors=(Actor("user", "Người dùng", 62, 292),),
        associations=(("user", "posts"),),
        relations=(
            r("posts", "list", "include", dx=-5, dy=4),
            r("filter", "list", "extend", dx=0, dy=11),
            r("detail", "list", "extend", dx=-29, dy=0),
            r("create", "posts", "extend", dx=0, dy=10),
            r("edit", "posts", "extend", dx=0, dy=-2),
            r("delete", "posts", "extend", dx=0, dy=-9),
            r("comment", "detail", "extend", dx=0, dy=11),
            r("like", "detail", "extend", dx=0, dy=-1),
            r("report", "detail", "extend", dx=0, dy=-10),
        ),
    ),
    Diagram(
        section="1.4.3.3",
        title="Quản lý tài liệu",
        main_key="documents",
        nodes=(
            n("documents", "Quản lý tài liệu", 270, 292, "main", 168, 64),
            n("list", "Xem danh sách tài liệu", 474, 450, "include"),
            n("create", "Thêm tài liệu", 474, 358, "extend"),
            n("update", "Cập nhật tài liệu", 474, 266, "extend"),
            n("delete", "Xóa tài liệu", 474, 174, "extend"),
            n("cleanup", "Xóa dữ liệu liên quan", 474, 82, "include"),
            n("validate", "Kiểm tra thông tin\nvà tệp", 677, 358, "include", 150),
            n("sync", "Đồng bộ PDF với AI", 677, 266, "extend", 150),
            n("confirm", "Xác nhận xóa", 677, 174, "include", 150),
        ),
        actors=(Actor("admin", "Quản trị viên", 62, 292),),
        associations=(("admin", "documents"),),
        relations=(
            r("documents", "list", "include", dx=-5, dy=5),
            r("create", "documents", "extend", dx=0, dy=10),
            r("update", "documents", "extend", dx=0, dy=0),
            r("delete", "documents", "extend", dx=0, dy=-10),
            r("create", "validate", "include", dx=0, dy=11),
            r("update", "validate", "include", dx=0, dy=-7),
            r("sync", "create", "extend", "PDF và AI sẵn sàng", dx=3, dy=13),
            r("sync", "update", "extend", "PDF và AI sẵn sàng", dx=2, dy=-13),
            r("delete", "confirm", "include", dx=0, dy=11),
            r("delete", "cleanup", "include", dx=-2, dy=-7),
        ),
    ),
    Diagram(
        section="1.4.3.4",
        title="Thống kê hệ thống",
        main_key="analytics",
        nodes=(
            n("analytics", "Thống kê hệ thống", 276, 292, "main", 174, 64),
            n("overview", "Tổng hợp chỉ số tổng quan", 489, 449, "include", 170),
            n("engagement", "Thống kê lượt xem\nvà lượt tải", 489, 344, "include", 170),
            n("growth", "Thống kê tăng trưởng\nhệ thống", 489, 239, "include", 170),
            n("ai", "Thống kê tần suất AI RAG", 489, 134, "include", 170),
            n("trending", "Lấy tài liệu nổi bật", 690, 397, "include", 150),
            n("recent", "Lấy tài liệu gần đây", 690, 292, "include", 150),
            n("dashboard", "Hiển thị Dashboard", 690, 187, "include", 150),
        ),
        actors=(Actor("admin", "Quản trị viên", 62, 292),),
        associations=(("admin", "analytics"),),
        relations=(
            r("analytics", "overview", "include", dx=-2, dy=8),
            r("analytics", "engagement", "include", dx=0, dy=4),
            r("analytics", "growth", "include", dx=0, dy=-4),
            r("analytics", "ai", "include", dx=0, dy=-8),
            r("analytics", "trending", "include", dx=4, dy=15),
            r("analytics", "recent", "include", dx=3, dy=3),
            r("analytics", "dashboard", "include", dx=4, dy=-13),
        ),
    ),
    Diagram(
        section="1.4.3.5",
        title="Quản lý nhóm (Admin)",
        main_key="groups",
        nodes=(
            n("groups", "Quản lý nhóm\n(Admin)", 270, 292, "main", 168, 66),
            n("list", "Xem danh sách nhóm", 472, 451, "include"),
            n("detail", "Xem chi tiết nhóm", 472, 361, "extend"),
            n("update", "Cập nhật nhóm", 472, 271, "extend"),
            n("requests", "Xử lý yêu cầu tham gia", 472, 181, "extend", 166),
            n("delete", "Xóa nhóm", 472, 91, "extend"),
            n("validate", "Kiểm tra dữ liệu nhóm", 678, 361, "include", 150),
            n("approve", "Duyệt yêu cầu", 678, 271, "normal", 150),
            n("reject", "Từ chối yêu cầu", 678, 181, "normal", 150),
            n("confirm", "Xác nhận xóa", 678, 91, "include", 150),
        ),
        actors=(Actor("admin", "Quản trị viên", 62, 292),),
        associations=(("admin", "groups"),),
        relations=(
            r("groups", "list", "include", dx=-4, dy=6),
            r("detail", "groups", "extend", dx=0, dy=10),
            r("update", "groups", "extend", dx=0, dy=1),
            r("requests", "groups", "extend", dx=0, dy=-5),
            r("delete", "groups", "extend", dx=0, dy=-10),
            r("update", "validate", "include", dx=0, dy=9),
            r("approve", "requests", "generalization"),
            r("reject", "requests", "generalization"),
            r("delete", "confirm", "include", dx=0, dy=10),
        ),
    ),
    Diagram(
        section="1.4.3.6",
        title="Quản lý yêu thích",
        main_key="favorites",
        nodes=(
            n("favorites", "Quản lý yêu thích", 276, 292, "main", 174, 64),
            n("list", "Xem danh sách yêu thích", 500, 432, "include", 170),
            n("add", "Thêm vào yêu thích", 500, 326, "extend", 170),
            n("remove", "Bỏ khỏi yêu thích", 500, 220, "extend", 170),
            n("detail", "Mở chi tiết tài liệu", 500, 114, "extend", 170),
            n("state", "Cập nhật trạng thái\nyêu thích", 700, 273, "include", 154),
        ),
        actors=(Actor("user", "Người dùng", 62, 292),),
        associations=(("user", "favorites"),),
        relations=(
            r("favorites", "list", "include", dx=-3, dy=7),
            r("add", "favorites", "extend", dx=0, dy=9),
            r("remove", "favorites", "extend", dx=0, dy=-8),
            r("detail", "list", "extend", dx=-10, dy=-3),
            r("add", "state", "include", dx=2, dy=10),
            r("remove", "state", "include", dx=2, dy=-10),
        ),
    ),
    Diagram(
        section="1.4.3.7",
        title="Đánh giá tài liệu",
        main_key="rating",
        nodes=(
            n("rating", "Đánh giá tài liệu", 274, 292, "main", 172, 64),
            n("stats", "Xem điểm trung bình\nvà số lượt đánh giá", 497, 438, "include", 178),
            n("submit", "Gửi đánh giá 1-5 sao", 497, 338, "extend", 178),
            n("validate", "Kiểm tra số sao hợp lệ", 700, 338, "include", 160),
            n("save", "Lưu đánh giá", 497, 210, "include", 178),
            n("update", "Cập nhật đánh giá đã có", 700, 210, "extend", 160),
            n("recalculate", "Tính lại và hiển thị\nkết quả đánh giá", 620, 92, "include", 178),
        ),
        actors=(Actor("user", "Người dùng", 62, 292),),
        associations=(("user", "rating"),),
        relations=(
            r("rating", "stats", "include", dx=-2, dy=8),
            r("submit", "rating", "extend", dx=0, dy=9),
            r("submit", "validate", "include", dx=0, dy=11),
            r("submit", "save", "include", dx=-28, dy=0),
            r("update", "save", "extend", "đã đánh giá", dx=0, dy=12),
            r("save", "recalculate", "include", dx=8, dy=-7),
        ),
    ),
    Diagram(
        section="1.4.3.8",
        title="Tìm kiếm tài liệu",
        main_key="search",
        nodes=(
            n("search", "Tìm kiếm tài liệu", 273, 292, "main", 172, 64),
            n("input", "Nhập từ khóa", 487, 449, "include", 164),
            n("filter_text", "Lọc theo tiêu đề,\ntác giả, mô tả", 487, 357, "include", 164),
            n("results", "Hiển thị kết quả", 487, 265, "include", 164),
            n("category", "Lọc theo danh mục", 487, 173, "extend", 164),
            n("sort", "Sắp xếp kết quả", 487, 81, "extend", 164),
            n("clear", "Xóa bộ lọc", 692, 357, "extend", 150),
            n("detail", "Mở chi tiết tài liệu", 692, 265, "extend", 150),
        ),
        actors=(Actor("user", "Người dùng", 62, 292),),
        associations=(("user", "search"),),
        relations=(
            r("search", "input", "include", dx=-2, dy=8),
            r("search", "filter_text", "include", dx=0, dy=5),
            r("search", "results", "include", dx=0, dy=-1),
            r("category", "search", "extend", dx=0, dy=-5),
            r("sort", "search", "extend", dx=0, dy=-10),
            r("clear", "search", "extend", dx=3, dy=13),
            r("detail", "results", "extend", dx=0, dy=11),
        ),
    ),
    Diagram(
        section="1.4.3.9",
        title="Thảo luận nhóm",
        main_key="discussion",
        nodes=(
            n("discussion", "Thảo luận nhóm", 280, 292, "main", 168, 64),
            n("access", "Kiểm tra quyền truy cập", 500, 441, "include", 172),
            n("history", "Xem lịch sử tin nhắn", 500, 349, "include", 172),
            n("channel", "Chọn kênh thảo luận", 500, 257, "extend", 172),
            n("send", "Gửi tin nhắn", 500, 165, "extend", 172),
            n("persist", "Kiểm tra, lưu và hiển thị\ntin nhắn", 500, 78, "include", 172),
            n("attachment", "Gửi tệp / hình ảnh", 704, 165, "extend", 154),
        ),
        actors=(
            Actor("user", "Người dùng", 62, 365),
            Actor("admin", "Quản trị viên", 62, 205),
        ),
        associations=(("user", "discussion"), ("admin", "discussion")),
        relations=(
            r("discussion", "access", "include", dx=-2, dy=9),
            r("discussion", "history", "include", dx=0, dy=6),
            r("channel", "discussion", "extend", dx=0, dy=1),
            r("send", "discussion", "extend", dx=0, dy=-8),
            r("send", "persist", "include", dx=-20, dy=-1),
            r("attachment", "send", "extend", dx=0, dy=11),
        ),
    ),
    Diagram(
        section="1.4.3.10",
        title="Trợ lý AI",
        main_key="assistant",
        boundary=(120, 54, 600, 466),
        nodes=(
            n("assistant", "Trợ lý AI", 250, 292, "main", 156, 64),
            n("history", "Xem lịch sử hội thoại", 430, 454, "include", 150),
            n("conversation", "Tạo / chọn hội thoại", 430, 370, "extend", 150),
            n("question", "Gửi câu hỏi", 430, 260, "extend", 150),
            n("delete", "Xóa hội thoại", 430, 90, "extend", 150),
            n("retrieve", "Truy xuất ngữ cảnh FAISS", 620, 454, "include", 150),
            n("general", "Trả lời bằng kiến thức chung", 620, 370, "extend", 150),
            n("generate", "Sinh câu trả lời Ollama", 620, 280, "include", 150),
            n("sources", "Đính kèm nguồn tham khảo", 620, 195, "extend", 150),
            n("response", "Lưu và hiển thị phản hồi", 620, 110, "include", 150),
            n("validate", "Kiểm tra và lưu câu hỏi", 430, 175, "include", 150),
        ),
        actors=(
            Actor("user", "Người dùng", 61, 292),
            Actor("ai", "Dịch vụ AI", 785, 335),
        ),
        associations=(("user", "assistant"), ("ai", "retrieve"), ("ai", "generate")),
        relations=(
            r("assistant", "history", "include", dx=-2, dy=9),
            r("conversation", "assistant", "extend", dx=0, dy=9),
            r("question", "assistant", "extend", dx=0, dy=-2),
            r("delete", "assistant", "extend", dx=0, dy=-10),
            r("question", "validate", "include", dx=-26, dy=0),
            r("question", "retrieve", "include", dx=5, dy=13),
            r("question", "generate", "include", dx=3, dy=11),
            r("question", "response", "include", dx=5, dy=-12),
            r("general", "retrieve", "extend", "không có ngữ cảnh", dx=0, dy=0),
            r("sources", "generate", "extend", "có ngữ cảnh", dx=0, dy=0),
        ),
    ),
)


def validate_diagrams(diagrams: Iterable[Diagram]) -> None:
    sections: set[str] = set()
    for diagram in diagrams:
        if diagram.section in sections:
            raise ValueError(f"Trùng mã mục: {diagram.section}")
        sections.add(diagram.section)
        nodes = {node.key for node in diagram.nodes}
        actors = {actor.key for actor in diagram.actors}
        if diagram.main_key not in nodes:
            raise ValueError(f"Thiếu UC chính trong {diagram.section}")
        for relation in diagram.relations:
            if relation.source not in nodes or relation.target not in nodes:
                raise ValueError(f"Quan hệ không hợp lệ trong {diagram.section}: {relation}")
        for actor_key, node_key in diagram.associations:
            if actor_key not in actors or node_key not in nodes:
                raise ValueError(f"Liên kết tác nhân không hợp lệ trong {diagram.section}")
    if len(sections) != 10:
        raise ValueError(f"Cần đúng 10 biểu đồ, hiện có {len(sections)}")


def main() -> None:
    register_fonts()
    validate_diagrams(DIAGRAMS)
    OUTPUT_PDF.parent.mkdir(parents=True, exist_ok=True)
    pdf = canvas.Canvas(str(OUTPUT_PDF), pagesize=landscape(A4), pageCompression=1)
    pdf.setTitle("Biểu đồ phân rã 10 use case - Library AI")
    pdf.setAuthor("Library AI - Nhóm 7")
    pdf.setSubject("Biểu đồ phân rã 10 use case trong mục 1.4.3")
    for index, diagram in enumerate(DIAGRAMS, start=1):
        draw_page(pdf, diagram, index)
    pdf.save()
    print(OUTPUT_PDF)


if __name__ == "__main__":
    main()
