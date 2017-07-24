/*
 * # Copyright (c) 2016-2017 The Khronos Group Inc.
 * # Copyright (c) 2016 Alexey Knyazev
 * #
 * # Licensed under the Apache License, Version 2.0 (the "License");
 * # you may not use this file except in compliance with the License.
 * # You may obtain a copy of the License at
 * #
 * #     http://www.apache.org/licenses/LICENSE-2.0
 * #
 * # Unless required by applicable law or agreed to in writing, software
 * # distributed under the License is distributed on an "AS IS" BASIS,
 * # WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * # See the License for the specific language governing permissions and
 * # limitations under the License.
 */

library gltf.cmd_line;

import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:args/args.dart';
import 'package:gltf/gltf.dart';
import 'package:gltf/src/errors.dart';
import 'package:path/path.dart' as path;

ArgResults argResult;

StringSink outPipe = stdout;
StringSink errPipe = stderr;

Future<Null> run(List<String> args) async {
  const kWarnings = 'warnings';
  const kValidateResources = 'validate-resources';
  const kPlainText = 'plain-text';

  const kErrorCode = 1;

  final parser = new ArgParser()
    ..addFlag(kValidateResources,
        abbr: 'r',
        help: 'Validate contents of embedded and/or '
            'referenced resources (buffers, images).',
        defaultsTo: false)
    ..addFlag(kPlainText,
        abbr: 'p',
        help: 'Print issues in plain text form to stderr.',
        defaultsTo: false)
    ..addFlag(kWarnings,
        abbr: 'w',
        help: 'Print warnings to plain text output.',
        defaultsTo: false);

  try {
    argResult = parser.parse(args);
  } on FormatException catch (_) {}

  if (argResult?.rest?.length != 1) {
    errPipe
      ..writeln('Usage: gltf_validator [<options>] <input>')
      ..writeln()
      ..writeln('Validation report will be written to '
          '`<asset_filename>_report.json`.')
      ..writeln('If <input> is a directory, '
          'validation reports will be recursively created for each glTF asset.')
      ..writeln()
      ..writeln('Validation log will be printed to stderr.')
      ..writeln()
      ..writeln('Shell return code will be non-zero '
          'if at least one error was found.')
      ..writeln(parser.usage);
    exitCode = kErrorCode;
  } else {
    final validateResources = argResult[kValidateResources] == true;
    final plainText = argResult[kPlainText] == true;
    final printWarnings = argResult[kWarnings] == true;

    const kJsonEncoder = const JsonEncoder.withIndent('    ');

    Future<bool> _processFile(String absolutePath) async {
      final result =
          await _validate(absolutePath, validateResources: validateResources);

      final reportPath = '${path.withoutExtension(absolutePath)}_report.json';

      // ignore: unawaited_futures
      new File(reportPath).writeAsString(kJsonEncoder.convert(result));

      if (plainText &&
          result != null &&
          (result.context.errors.isNotEmpty ||
              result.context.warnings.isNotEmpty)) {
        _writeIssues(result.context.errors.toList(), 'Errors');
        if (printWarnings) {
          _writeIssues(result.context.warnings.toList(), 'Warnings');
        }
      }

      return result.context.errors.isNotEmpty;
    }

    var foundErrors = false;
    final input = argResult.rest[0];
    if (FileSystemEntity.isDirectorySync(input)) {
      final dir = new Directory(input);

      final watch = new Stopwatch();
      for (var entry in dir.listSync(recursive: true)) {
        final ext = path.extension(entry.path);
        if ((ext == '.gltf') || (ext == '.glb')) {
          watch.start();
          if (await _processFile(entry.absolute.path)) {
            foundErrors = true;
          }
          watch.stop();
        }
      }
      errPipe.write('Elapsed: ${watch.elapsedMilliseconds}ms\n');
    } else if (FileSystemEntity.isFileSync(input)) {
      if (await _processFile(input)) {
        foundErrors = true;
      }
    } else {
      errPipe.write('Can not open $input\n');
      exitCode = kErrorCode;
    }
    if (foundErrors) {
      exitCode = kErrorCode;
    }
  }
}

Future<ValidationResult> _validate(String filename,
    {bool validateResources: false}) async {
  final file = new File(filename);
  final ext = path.extension(filename).toLowerCase();

  final context = new Context();
  final reader = new GltfReader(file.openRead(), context, ext);

  if (reader == null) {
    errPipe.write('Unknown file extension `$ext`.\n');
    return null;
  } else {
    errPipe.write('Loading ${file.path}...\n');
  }

  GltfReaderResult readerResult;
  try {
    readerResult = await reader.read();
    errPipe.write('Errors: ${context.errors.length}, '
        'Warnings: ${context.warnings.length}\n\n');
  } on FileSystemException catch (e) {
    errPipe.writeln(e);
    return null;
  }

  final validationResult =
      new ValidationResult(new Uri.file(filename), context, readerResult);

  if (readerResult?.gltf != null && validateResources) {
    final resourcesLoader =
        getFileResourceValidator(validationResult, readerResult);
    await resourcesLoader.load();
  }

  return validationResult;
}

void _writeIssues(List<Issue> issues, String title) {
  if (issues.isNotEmpty) {
    errPipe
      ..write('\t$title:\n\t\t')
      ..writeAll(issues, '\n\t\t')
      ..write('\n\n');
  }
}

ResourcesLoader getFileResourceValidator(
        ValidationResult validationResult, GltfReaderResult readerResult) =>
    new ResourcesLoader(validationResult, readerResult.gltf,
        externalBytesFetch: (uri) {
          if (uri == null) {
            // GLB-stored buffer
            return readerResult.buffer;
          }
          return new File.fromUri(validationResult.absoluteUri.resolveUri(uri))
              .readAsBytes();
        },
        externalStreamFetch: (uri) =>
            new File.fromUri(validationResult.absoluteUri.resolveUri(uri))
                .openRead());
