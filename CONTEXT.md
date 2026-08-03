# Denji CLI

The Denji CLI manages icon collections and generates framework-specific output from Iconify sources.

## Output management

**Output Target**:
The configured destination where Denji generates and maintains an icon collection; it is either one file or a folder of files.
_Avoid_: output mode, destination

**Generated Icon**:
An icon prepared for persistence at an Output Target, identified by its component name and carrying rendered component content with optional source identity.
_Avoid_: component, icon file

**Stored Icon**:
An icon currently represented in an Output Target, identified by its component name and optional source identity.
_Avoid_: output entry, generated icon
